import { createDraftStore } from "@/lib/draft-store";
import type { HealthAnswers, MassageAnswers, SkinAnswers } from "@/lib/record-card";
import type { Values as DetailsValues } from "./DetailsForm";

export type CardDraft = {
  health?: HealthAnswers;
  massage?: MassageAnswers;
  skin?: SkinAnswers;
  details?: DetailsValues;
};

/**
 * Unsaved card-editor edits left behind when the editor was hidden by Back, a swipe or a history jump, kept so the
 * next Edit on that card starts from them. JavaScript memory only (never browser storage): a reload or closing the
 * tab ends it, and sign-out clears it before loading the sign-in page.
 * Keyed by the card's id (its uuid primary key). An editor only ever reads cardDrafts.get(<its own client.id>) and
 * only writes under that same id, so one client's draft can't reach another client's editor.
 */
export const cardDrafts = createDraftStore<CardDraft>();
