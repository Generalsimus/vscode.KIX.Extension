import { performance, PerformanceObserver } from "perf_hooks";


const perfObserver = new PerformanceObserver((items) => {
	items.getEntries().forEach((entry) => {
		console.log(  entry);
	});
});

perfObserver.observe({ entryTypes: ["measure"], buffered: true });

export const createPerfHook = (parentName = "perf") => {
	const startName = `${parentName}-start`;
	const endName = `${parentName}-end`;
	const key = `${parentName}-hook:`;
	return {
		start() {
			performance.mark(startName);
		},
		end() {
			performance.mark(endName);
			performance.measure(key, startName, endName);
		}
	};
};