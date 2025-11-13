export interface Visitor {
  id: number;
  username: string | null;
  name: string | null;
  creation_date: string;
  last_visit_date: string;
  real_name: string | null;
  comment: string | null;
}
