# Paper skeleton

## Title
FairDRAM: QoS-Aware Memory Scheduling for CPU-AI Co-Execution

## One-sentence claim
A memory controller can substantially reduce CPU tail slowdown under accelerator memory interference by detecting sparse or aged CPU memory phases and giving those requests bounded priority.

## Baseline
FRFCFS, Ramulator 2.x generic controller, DDR4_2400R, SimpleO3 frontend.

## Proposed mechanism
FairDRAM is a scheduler-level policy. It uses Ramulator request `source_id` to identify CPU cores, detects latency-sensitive CPU phases from low CPU queue depth and aged CPU requests, and applies bounded priority before falling back to row-buffer locality and FCFS.

## Main figure
CPU and AI accelerator share one DRAM controller. Requests enter a read/write queue. FairDRAM classifies requests and schedules DRAM commands to DDR4 banks.

## Result panels
- Panel A: CPU slowdown under AI interference.
- Panel B: AI throughput loss.
- Panel C: Jain fairness over normalized throughput.

## Experimental matrix
CPU workloads: sparse latency-sensitive, graph/random, bursty.
AI workloads: streaming reads, random reads, write-heavy stream.
Schedulers: FRFCFS and FairDRAM.

## Important caveat
Synthetic traces are useful for a first paper-like artifact, but a stronger paper should add real traces from graph analytics, web-service/cache misses, and accelerator kernels or a gem5/accelerator wrapper.
