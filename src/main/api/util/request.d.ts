import { requestMethodType } from '../../../types/mainType'

export default function createRequest(
    method: requestMethodType,
    url: string,
    data: object,
    options: object | undefined
): Promise<object>
