export const sortQueryString = (mockUrl: string): string => {
	const [host, query] = mockUrl.split('?', 2) as [string, string | undefined]
	if (query === undefined || (query?.length ?? 0) === 0) return host
	return `${host}?${sortQuery(new URLSearchParams(query))}`
}

export const sortQuery = (
	query: URLSearchParams | Record<string, string>,
): string => {
	const params: string[][] = []
	if (query instanceof URLSearchParams) {
		query.forEach((v, k) => {
			params.push([k, v])
		})
	} else {
		params.push(...Object.entries(query))
	}
	params.sort(([k1], [k2]) => (k1 ?? '').localeCompare(k2 ?? ''))
	const sortedParams = new URLSearchParams()
	for (const [k, v] of params) {
		sortedParams.append(k as string, v as string)
	}
	return sortedParams.toString()
}
