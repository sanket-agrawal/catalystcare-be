export interface CreateWebinarDTO {
  title: string;
  description?: string;
  bannerUrl?: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;
  capacity?: number;
  isPaid?: boolean;
  price?: number;
  pricePaise?: number;
  currency?: string;
  meetingLink?: string;
  meetingProvider?: string;
}

export interface UpdateWebinarDTO extends Partial<CreateWebinarDTO> {}

export enum WebinarStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}