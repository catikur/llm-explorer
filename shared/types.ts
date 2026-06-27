// Veri kümesi tipleri — hem istemci (tarayıcı) hem de Node tazeleme scripti tarafından
// paylaşılır. Tek kaynak: şema değişirse buradan değişir.

export interface LLMModel {
  id: string;
  name: string;
  vendor: string;
  context_length: number;
  max_completion_tokens: number | null;
  modality: string;
  input_modalities: string;
  output_modalities: string;
  is_multimodal: boolean;
  image_input: boolean;
  audio_input: boolean;
  file_input: boolean;
  image_output: boolean;
  prompt_price: number | null;
  completion_price: number | null;
  blended_price: number | null;
  is_free: boolean;
  cache_read: number | null;
  tools: boolean;
  reasoning: boolean;
  structured_outputs: boolean;
  is_moderated: boolean;
  intelligence_index: number | null;
  output_tps: number | null;
  latency_s: number | null;
  has_benchmark: boolean;
  usecases: string[];
  tier: "frontier" | "advanced" | "standard" | "lightweight" | "unknown";
  value_score: number | null;
}

export interface UsecaseMeta {
  tr: string;
  en: string;
  icon: string;
  desc_tr: string;
  desc_en: string;
}

export interface Dataset {
  generated_at: string;
  total: number;
  vendors: string[];
  usecase_meta: Record<string, UsecaseMeta>;
  models: LLMModel[];
}
