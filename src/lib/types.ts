export interface SongListItem {
  id: string
  title: string
  artist: string | null
}

export interface Song {
  id: string
  title: string
  artist: string | null
  body: string
}