import ApiUrls from '../../types/preloadType'
export async function constructServer(
    route: (typeof ApiUrls)[number],
    moduleQuery: object
): Promise<object>
