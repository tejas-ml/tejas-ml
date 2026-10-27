# FairDRAM: QoS-aware Memory Scheduling for CPU-AI Co-Execution

This is a runnable mini-research artifact for the project idea:

> AI workloads can flood memory bandwidth and hurt latency-sensitive CPU tasks. FairDRAM detects sparse/aged CPU memory requests and gives them bounded priority while preserving accelerator throughput through a quota and row-locality fallback.

The package contains:

- `ramulator2_patch/fairdram_scheduler.cpp`: Ramulator 2.x scheduler implementation.
- `ramulator2_patch/install_fairdram.py`: installer that copies the scheduler into Ramulator and patches CMake.
- `scripts/gen_traces.py`: synthetic SimpleO3 CPU and AI trace generator.
- `scripts/run_ramulator2_experiments.py`: runs CPU-alone, AI-alone, and mixed CPU+AI experiments.
- `scripts/plot_results.py`: creates the main architecture figure and the 3-panel result figure.
- `scripts/make_illustrative_results.py`: creates fake numbers only for checking the plotting pipeline. Do not use these numbers in a paper.

## 1. Clone and build Ramulator 2.x

```bash
git clone https://github.com/CMU-SAFARI/ramulator2
cd ramulator2
mkdir build
cd build
cmake ..
make -j
cp ./ramulator2 ../ramulator2
cd ..
```

Ramulator 2.0 uses C++20 and is documented by the authors as tested with `g++-12` and `clang++-15`.

## 2. Install FairDRAM into Ramulator

From this artifact directory:

```bash
python3 ramulator2_patch/install_fairdram.py /path/to/ramulator2 --build --jobs 8
```

This adds:

```text
src/dram_controller/impl/scheduler/fairdram_scheduler.cpp
```

and inserts it into:

```text
src/dram_controller/CMakeLists.txt
```

After this, Ramulator config files can use:

```yaml
Scheduler:
  impl: FairDRAM
  cpu_source_ids: "0"
  cpu_low_queue_threshold: 4
  age_gap_threshold: 128
  cpu_quota_pct: 70
  epoch_len: 1024
```

## 3. Install Python dependencies

```bash
python3 -m pip install -r requirements.txt
```

## 4. Generate traces

```bash
python3 scripts/gen_traces.py --out traces --insts 50000 --working-set-mb 128
```

Generated SimpleO3 traces use this format:

```text
<bubble_count> <load_addr> [store_addr]
```

Core/source convention:

- CPU core is trace index 0, so Ramulator request `source_id = 0`.
- AI accelerator proxy is trace index 1, so Ramulator request `source_id = 1`.

## 5. Run the experiments

```bash
python3 scripts/run_ramulator2_experiments.py \
  --ramulator2 /path/to/ramulator2/ramulator2 \
  --traces traces \
  --out results \
  --insts 50000 \
  --schedulers FRFCFS FairDRAM
```

To smoke-test quickly:

```bash
python3 scripts/run_ramulator2_experiments.py \
  --ramulator2 /path/to/ramulator2/ramulator2 \
  --traces traces \
  --out results \
  --insts 10000 \
  --limit-mixes 1
```

The script writes:

- `results/configs/*.yaml`: generated Ramulator configs.
- `results/logs/*.log`: raw Ramulator outputs.
- `results/summary.csv`: paper-ready metrics.

## 6. Plot the figures

```bash
python3 scripts/plot_results.py --summary results/summary.csv --out figures
```

Outputs:

- `figures/main_figure.png` and `.pdf`
- `figures/result_panels.png` and `.pdf`
- `figures/panel_a_cpu_slowdown.png` and `.pdf`
- `figures/panel_b_ai_throughput_loss.png` and `.pdf`
- `figures/panel_c_fairness.png` and `.pdf`

For the full demo pipeline:

```bash
make demo
```

For the full Ramulator-backed pipeline:

```bash
make paper RAMULATOR2=/path/to/ramulator2/ramulator2
```

## Metrics

For each CPU+AI mix and scheduler:

- **Panel A: CPU slowdown** = `cpu_mixed_cycles / cpu_alone_cycles`. Lower is better.
- **Panel B: accelerator throughput loss** = `100 * (1 - ai_alone_cycles / ai_mixed_cycles)`. Lower is better.
- **Panel C: Jain fairness** over normalized throughputs: CPU normalized throughput is `cpu_alone_cycles / cpu_mixed_cycles`, and AI normalized throughput is `ai_alone_cycles / ai_mixed_cycles`. Higher is better.

## FairDRAM algorithm summary

For each candidate request in the selected Ramulator request buffer:

1. Compute the next prerequisite DRAM command.
2. Mark whether the command is ready under DRAM timing constraints.
3. Mark whether the request comes from the CPU source set.
4. Mark CPU requests urgent when the CPU queue is sparse or when the CPU request is old relative to other queued requests.
5. Select by: ready command, urgent CPU request, row-buffer hit, then FCFS.
6. Enforce an approximate CPU-priority quota per epoch so AI throughput is not destroyed.

This is intentionally simple enough for a course/research prototype and easy to extend. The next improvement would be to move the quota update into the controller after a command actually issues, rather than updating inside `get_best_request()`.

## Demo-only plotting without Ramulator

To verify that matplotlib and the figure pipeline work:

```bash
make demo
```

This produces illustrative fake data. Do not use `make demo` numbers as experimental results.
