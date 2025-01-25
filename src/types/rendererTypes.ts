export interface ArtistsType {
    id: number
    name: string
    img1v1Id: number
    img1v1Url: string
    albumSize: number
}

export interface AlbumType {
    blurPicUrl: string
    copyrightId: string
    id: number
    name: string
    pic: number
    picId: number
    picId_str: string
    picUrl: string
    publishTime: number
    subType: string
    type: string
    status: number
    size: number
}

export interface SongType {
    id: number
    mvid: number
    name: string
    status: number
    album: AlbumType
    artists: ArtistsType[]
}

export interface listSongTypes {
    alg: string
    canDislike: boolean
    id: number
    name: string
    picUrl: string
    type: number
    song: SongType
}
