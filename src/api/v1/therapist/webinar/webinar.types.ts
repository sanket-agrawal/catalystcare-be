export interface CreateWebinarDTO {
  title: string;
  description?: string;
  bannerUrl?: string;
  startTime: Date;
  endTime: Date;
  price: number;
}

export interface UpdateWebinarDTO extends Partial<CreateWebinarDTO> {}

export enum WebinarStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}