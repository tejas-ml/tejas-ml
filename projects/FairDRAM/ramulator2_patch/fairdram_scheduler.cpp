#include <algorithm>
#include <cctype>
#include <sstream>
#include <string>
#include <unordered_set>
#include <vector>

#include "base/base.h"
#include "dram_controller/controller.h"
#include "dram_controller/scheduler.h"

namespace Ramulator {

class FairDRAM : public IScheduler, public Implementation {
  RAMULATOR_REGISTER_IMPLEMENTATION(
      IScheduler, FairDRAM, "FairDRAM",
      "QoS-aware CPU/AI co-execution DRAM scheduler.")

private:
  IDRAM* m_dram = nullptr;

  // Scratchpad indices. Ramulator Request::scratchpad is meant for temporary
  // scheduler metadata.
  const int READY_IDX = 0;
  const int CPU_IDX = 1;
  const int URGENT_IDX = 2;
  const int ROWHIT_IDX = 3;

  std::unordered_set<int> m_cpu_sources;

  // A CPU request is treated as latency-sensitive when it is sparse in the
  // queue or when it has aged relative to other queued requests.
  int m_cpu_low_queue_threshold = 4;
  int m_age_gap_threshold = 128;

  // Quota avoids starving the accelerator. Example: 70 means at most roughly
  // 70% of selected requests in an epoch may be CPU-priority requests.
  int m_cpu_quota_pct = 70;
  int m_epoch_len = 1024;
  int m_epoch_picks = 0;
  int m_epoch_cpu_picks = 0;

public:
  void init() override {
    std::string cpu_source_ids = param("cpu_source_ids")
                                     .desc("Comma-separated source IDs treated as CPU cores.")
                                     .default_val("0");
    m_cpu_low_queue_threshold = param("cpu_low_queue_threshold")
                                    .desc("CPU queue depth at or below which CPU requests are latency-sensitive.")
                                    .default_val(4);
    m_age_gap_threshold = param("age_gap_threshold")
                              .desc("Arrival-cycle gap that marks an older CPU request urgent.")
                              .default_val(128);
    m_cpu_quota_pct = param("cpu_quota_pct")
                          .desc("Approximate max percent of epoch picks allowed for CPU priority.")
                          .default_val(70);
    m_epoch_len = param("epoch_len")
                      .desc("Number of scheduler selections per quota epoch.")
                      .default_val(1024);

    parse_cpu_sources(cpu_source_ids);
  }

  void setup(IFrontEnd* frontend, IMemorySystem* memory_system) override {
    m_dram = cast_parent<IDRAMController>()->m_dram;
  }

  ReqBuffer::iterator compare(ReqBuffer::iterator req1,
                              ReqBuffer::iterator req2) override {
    const bool ready1 = req1->scratchpad[READY_IDX];
    const bool ready2 = req2->scratchpad[READY_IDX];
    if (ready1 ^ ready2) {
      return ready1 ? req1 : req2;
    }

    const bool urgent1 = req1->scratchpad[URGENT_IDX];
    const bool urgent2 = req2->scratchpad[URGENT_IDX];
    if (urgent1 ^ urgent2) {
      return urgent1 ? req1 : req2;
    }

    // Preserve row-buffer locality after QoS protection.
    const bool rowhit1 = req1->scratchpad[ROWHIT_IDX];
    const bool rowhit2 = req2->scratchpad[ROWHIT_IDX];
    if (rowhit1 ^ rowhit2) {
      return rowhit1 ? req1 : req2;
    }

    // FCFS fallback.
    return (req1->arrive <= req2->arrive) ? req1 : req2;
  }

  ReqBuffer::iterator get_best_request(ReqBuffer& buffer) override {
    if (buffer.size() == 0) {
      return buffer.end();
    }

    if (m_epoch_picks >= m_epoch_len) {
      m_epoch_picks = 0;
      m_epoch_cpu_picks = 0;
    }

    int cpu_pending = 0;
    Clk_t newest_arrive = 0;
    for (auto& req : buffer) {
      newest_arrive = std::max(newest_arrive, req.arrive);
      if (is_cpu(req.source_id)) {
        cpu_pending++;
      }
    }

    const bool cpu_budget_available =
        (m_epoch_picks == 0) ||
        ((100 * m_epoch_cpu_picks) < (m_cpu_quota_pct * std::max(1, m_epoch_picks)));

    for (auto& req : buffer) {
      req.command = m_dram->get_preq_command(req.final_command, req.addr_vec);
      const bool ready = m_dram->check_ready(req.command, req.addr_vec);
      const bool cpu = is_cpu(req.source_id);
      const bool rowhit = m_dram->check_rowbuffer_hit(req.final_command, req.addr_vec);
      const bool sparse_cpu_phase = cpu && cpu_pending <= m_cpu_low_queue_threshold;
      const bool aged_cpu_tail = cpu && (newest_arrive - req.arrive >= m_age_gap_threshold);
      const bool urgent = cpu_budget_available && (sparse_cpu_phase || aged_cpu_tail);

      req.scratchpad[READY_IDX] = ready;
      req.scratchpad[CPU_IDX] = cpu;
      req.scratchpad[URGENT_IDX] = urgent;
      req.scratchpad[ROWHIT_IDX] = rowhit;
    }

    auto candidate = buffer.begin();
    for (auto next = std::next(buffer.begin(), 1); next != buffer.end(); next++) {
      candidate = compare(candidate, next);
    }

    m_epoch_picks++;
    if (candidate != buffer.end() && candidate->scratchpad[CPU_IDX]) {
      m_epoch_cpu_picks++;
    }
    return candidate;
  }

private:
  bool is_cpu(int source_id) const {
    return m_cpu_sources.find(source_id) != m_cpu_sources.end();
  }

  void parse_cpu_sources(const std::string& csv) {
    std::stringstream ss(csv);
    std::string item;
    while (std::getline(ss, item, ',')) {
      item.erase(std::remove_if(item.begin(), item.end(), ::isspace), item.end());
      if (!item.empty()) {
        m_cpu_sources.insert(std::stoi(item));
      }
    }
    if (m_cpu_sources.empty()) {
      m_cpu_sources.insert(0);
    }
  }
};

}  // namespace Ramulator
