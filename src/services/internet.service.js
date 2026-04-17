import {tavily as Tavily} from '@tavily/core';

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})

export const searchInternet = async ({query}) => {
    const results = await tavily.search(query, {
        maxResults: 5,
    })
    return results.results
        ?.map(r => `${r.title}\n${r.content}\n${r.url}`)
        .join("\n\n") || "No results found";
}   