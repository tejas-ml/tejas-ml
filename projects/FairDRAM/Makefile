.PHONY: traces run plot demo paper clean

TRACES ?= traces
RESULTS ?= results
FIGURES ?= figures
RAMULATOR2 ?= ./ramulator2/ramulator2
INSTS ?= 50000

traces:
	python3 scripts/gen_traces.py --out $(TRACES) --insts $(INSTS)

run: traces
	python3 scripts/run_ramulator2_experiments.py --ramulator2 $(RAMULATOR2) --traces $(TRACES) --out $(RESULTS) --insts $(INSTS)

plot:
	python3 scripts/plot_results.py --summary $(RESULTS)/summary.csv --out $(FIGURES)

demo:
	python3 scripts/make_illustrative_results.py --out $(RESULTS)
	python3 scripts/plot_results.py --summary $(RESULTS)/summary.csv --out $(FIGURES)

paper:
	python3 scripts/gen_traces.py --out $(TRACES) --insts $(INSTS)
	python3 scripts/run_ramulator2_experiments.py --ramulator2 $(RAMULATOR2) --traces $(TRACES) --out $(RESULTS) --insts $(INSTS)
	python3 scripts/plot_results.py --summary $(RESULTS)/summary.csv --out $(FIGURES)

clean:
	rm -rf $(TRACES) $(RESULTS) $(FIGURES)
