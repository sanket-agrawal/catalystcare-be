export type SlotForResponse = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
};

export type SlotGroupByDate = {
  date: string;
  slots: SlotForResponse[];
};

export type TestimonialsWithClient = {
  client: { firstName: string; lastName: string };
  text: string;
  rating: number;
};

export type TherapistResponse = {
  slug: string;
  about: string | null;
  yearOfExperience: number | null;
  languageSpoken: string[] | null;
  sessionFee: number | null;
  user: { firstName: string; lastName: string; profilePhoto: string | null };
  categories: { slug: string; name: string }[];
  subCategories: { slug: string; name: string }[];
  testimonials: TestimonialsWithClient[];
  slots: SlotGroupByDate[];
  averageRating: number | null;
  totalReviews: number;
  shareUrl: string;
};
