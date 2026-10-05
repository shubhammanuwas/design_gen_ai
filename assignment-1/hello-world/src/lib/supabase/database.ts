export type UserRow = {
  id: number | string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type GenerationRow = {
  id: string;
  user_id: string;
  photo_path: string;
  prompt: string;
  caption: string;
  created_at: string;
};

export type CaptionVoteRow = {
  generation_id: string;
  user_id: string;
  value: -1 | 1;
  created_at: string;
};

export type CaptionVoteCounts = {
  generation_id: string;
  upvotes: number;
  downvotes: number;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      generations: {
        Row: GenerationRow;
        Insert: {
          id?: string;
          user_id: string;
          photo_path: string;
          prompt: string;
          caption: string;
          created_at?: string;
        };
        Update: {
          photo_path?: string;
          prompt?: string;
          caption?: string;
        };
        Relationships: [];
      };
      caption_votes: {
        Row: CaptionVoteRow;
        Insert: {
          generation_id: string;
          user_id: string;
          value: -1 | 1;
          created_at?: string;
        };
        Update: { value?: -1 | 1 };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_caption_vote_counts: {
        Args: Record<never, never>;
        Returns: CaptionVoteCounts[];
      };
    };
  };
};