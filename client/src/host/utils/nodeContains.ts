export const containNode = <N extends { pos: number, end: number }>(node: N, check: N) => {
	return node.pos < check.pos && check.end < node.end;
};