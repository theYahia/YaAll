# Brave sweep — 12 queries

**Config:** country=us, lang=en, extra_snippets=on
**Endpoints used:** web
**Generated:** 2026-04-24T09:31:37Z | **Script:** brave_sweep.py v2

---

## ⚠️ Silent behavior warnings

- ["rubert" OR "sbert" russian semantic sim]: 3 JSON-serialized snippets
- ["LLM Spot" Digital Geeks brand visibility platform]: zero web results


## q01 — "Natasha DeepPavlov pymorphy2 razdel russian NER сравнение production"

**Meta:** original='Natasha DeepPavlov pymorphy2 razdel russian NER сравнение production'

### 🔎 Web (10 results)

**1. GitHub - natasha/naeval: Comparing quality and performance of NLP systems for Russian language**
- URL: https://github.com/natasha/naeval
- Naeval — comparing quality and performance of NLP systems for Russian language. Naeval is used to evaluate project Natasha components: Razdel, Navec, Slovnet. ... BiLSTM-CRF NER trained on Collection5. Original repo, docs, paper ... Current SOTA for Russian language. Docs, video ... DeepPavlov solution for BSNLP-2019.
  > Naeval — comparing quality and performance of NLP systems for Russian language. Naeval is used to evaluate project Natasha components: Razdel, Navec, Slovnet. ... BiLSTM-CRF NER trained on Collection5. Original repo, docs, paper ... Current SOTA for Russian language. Docs, video ... DeepPavlov solution for BSNLP-2019.

**2. Naeval — количественное сравнение систем для русскоязычного NLP**
- URL: https://natasha.github.io/naeval/
- Проект Natasha решает базовые задачи обработки естественного русского языка: сегментация на токены и предложения, анализ морфологии и синтаксиса, NER...
  > Сетка решений и тестовых датасетов из репозитория Naeval. Инструменты проекта Natasha: Razdel, Navec, Slovnet.
  > Natasha — не научный проект, у нас нет цели побить SOTA.
  > Проект Natasha решает базовые задачи обработки естественного русского языка: сегментация на токены и предложения, анализ морфологии и синтаксиса, NER.
  > Naeval — часть проекта Natasha, набор скриптов для оценки качества и скорости работы открытых инструментов для обработки естественного русского языка:

**3. GitHub - natasha/slovnet: Deep Learning based NLP modeling for Russian language · GitHub**
- URL: https://github.com/natasha/slovnet
- Slovnet provides high quality practical ... section for more: NER is 1-2% worse than current BERT SOTA by DeepPavlov but 60 times smaller in size (~30 MB) and works fast on CPU (~25 news articles/sec)....
  > Library is integrated with other Natasha projects: Nerus — large automatically annotated corpus, Razdel — sentence segmenter, tokenizer and Navec — compact Russian embeddings. Slovnet provides high quality practical models for Russian NER, morphology and syntax, see evaluation section for more: NER is 1-2% worse than current BERT SOTA by DeepPavlov but 60 times smaller in size (~30 MB) and works fast on CPU (~25 news articles/sec).
  > Slovnet is compated to a number of existing morphology taggers: deeppavlov, deeppavlov_bert, rupostagger, rnnmorph, maru, udpipe, spacy, stanza.
  > Slovnet is compated to several existing syntax parsers: udpipe, spacy, deeppavlov, stanza.
  > Morphology annotator processes tokenized text. To split the input into sentencies and tokens use Razdel.

**4. Инструменты для решения NER-задач для русского языка — NTA на vc.ru**
- URL: https://vc.ru/newtechaudit/358200-instrumenty-dlya-resheniya-ner-zadach-dlya-russkogo-yazyka
- Передадим текст с данной новостью в Doc(). Далее сегментируем наш текст (Natasha использует для этого еще одну свою разработку именуемую «Раздел» (https://github.com/natasha/razdel )), посмотрим на первые и последние 5 токенов:
- Age: April 24, 2024
  > Часто приходится работать с большими объемами документов, к примеру, исполнительными листами, заявлениями, договорами, из текстов которых зачастую необходимо извлечь весьма конкретную информацию: ФИО, даты рождения, наименования должности, паспортные данные, адрес, ИНН и наименование компаний, даты подписания документов и так далее.
  > Передадим текст с данной новостью в Doc(). Далее сегментируем наш текст (Natasha использует для этого еще одну свою разработку именуемую «Раздел» (https://github.com/natasha/razdel )), посмотрим на первые и последние 5 токенов:
  > С лемматизацией (процессом приведения слова к нормальной форме) проблем также не обнаружено. Эта задача решается с помощью известной многим разработкой Яндекса Pymorphy (https://pymorphy2.readthedocs.io/en/stable/user/guide.html ):
  > Пожалуй, первое что приходит в голову Data Scientist’у, когда речь идет о NLP или конкретно NER-задачах — это проекты DeepPavlov.

**5. Natasha — качественный компактный NER для русского языка**
- URL: https://natasha.github.io/ner/
- В 2020 году в проекте ... NER, размер модели получился в 75 раз меньше (27МБ), потребление памяти в 30 раз меньше (205МБ), скорость в 2 раза больше на CPU (25 статей в секунду)....
  > В 2020 году в проекте Natasha нам удалось вплотную приблизится по качеству к DeepPavlov BERT NER, размер модели получился в 75 раз меньше (27МБ), потребление памяти в 30 раз меньше (205МБ), скорость в 2 раза больше на CPU (25 статей в секунду).
  > Качество на 1 процентный пункт ниже, чем у SOTA DeepPavlov BERT NER, размер модели в 75 раз меньше, потребление памяти в 30 раз меньше, скорость в 2 раза больше на CPU.
  > Natasha (Slovnet NER) = Slovnet BERT NER — аналог DeepPavlov BERT NER + дистилляция через синтетическую разметку (Nerus) в WordCNN-CRF c квантованными эмбеддингами (Navec) + движок для инференса на NumPy.
  > Получим Slovnet BERT NER, качество на 0.5 процентных пункта лучше, чем у DeepPavlov BERT NER, размер модели меньше в 4 раза (473МБ), работает в 3 раза быстрее (40 статей в секунду).

**6. GitHub - natasha/natasha-spacy: SpaCy official Russian model proposal · GitHub**
- URL: https://github.com/natasha/natasha-spacy
- Nerus — part of Natasha project, large silver standard Russian corpus annotated with morphology tags, syntax trees and PER, LOC, ORG NER-tags. Navec — also part of Natasha project, pretrained word embeddings for Russian language. Code in this repo is also available under MIT license. Resulting model is relatively small due to embeddings table pruning (138MB), works fast on CPU. Shows near SOTA per
  > Both Nerus and Navec are adapted to fit SpaCy utilities. Training procedure uses only standart spacy convert, spacy init-model, spacy train. Initialize the environment. We use SpaCy 2.3 for training, Russian language in SpaCy requires PyMorphy for morphology. pip install spacy==2.3.5 pymorphy2==0.8 mkdir -p data train/data train/base train/model
  > Nerus — part of Natasha project, large silver standard Russian corpus annotated with morphology tags, syntax trees and PER, LOC, ORG NER-tags. Navec — also part of Natasha project, pretrained word embeddings for Russian language. Code in this repo is also available under MIT license. Resulting model is relatively small due to embeddings table pruning (138MB), works fast on CPU. Shows near SOTA performance on tasks of morphology tagging and syntax parsing, beating heavy DeepPavlov BERT on news an
  > On NER task model shows quality comparable to other top Russian systems, beating DeepPavlov, PullEnti, Stanza.
  > Use ipymarkup for NER and syntax visualization.

**7. GitHub - natasha/natasha: Solves basic Russian NLP tasks, API for lower level Natasha projects · GitHub**
- URL: https://github.com/natasha/natasha
- Natasha solves basic NLP tasks for Russian language: tokenization, sentence segmentation, word embedding, morphology tagging, lemmatization, phrase normalization, syntax parsing, NER tagging, fact extraction. Quality on every task is similar or better than current SOTAs for Russian language on news articles, see evaluation section. Natasha is not a research project, underlying technologies are bui
  > Natasha solves basic NLP tasks for Russian language: tokenization, sentence segmentation, word embedding, morphology tagging, lemmatization, phrase normalization, syntax parsing, NER tagging, fact extraction. Quality on every task is similar or better than current SOTAs for Russian language on news articles, see evaluation section. Natasha is not a research project, underlying technologies are built for production. We pay attention to model size, RAM usage and performance. Models run on CPU, use
  > Split text into tokens and sentencies. Defines tokens and sents properties of doc. Uses Razdel internally.
  > Extract standart named entities: names, locations, organizations. Depends on segmentation step. Defines spans property of doc. Uses Slovnet NER model internally.
  > Call ner.print() to visualize NER markup.

**8. slovnet · PyPI**
- URL: https://pypi.org/project/slovnet/
- Slovnet provides high quality practical ... section for more: NER is 1-2% worse than current BERT SOTA by DeepPavlov but 60 times smaller in size (~30 MB) and works fast on CPU (~25 news articles/sec)....
  > Library is integrated with other Natasha projects: Nerus — large automatically annotated corpus, Razdel — sentence segmenter, tokenizer and Navec — compact Russian embeddings. Slovnet provides high quality practical models for Russian NER, morphology and syntax, see evaluation section for more: NER is 1-2% worse than current BERT SOTA by DeepPavlov but 60 times smaller in size (~30 MB) and works fast on CPU (~25 news articles/sec).
  > Slovnet is compated to several existing syntax parsers: udpipe, spacy, deeppavlov, stanza. ... python -m venv ~/.venvs/natasha-slovnet source ~/.venvs/natasha-slovnet/bin/activate pip install -r requirements/dev.txt pip install -e .
  > Slovnet is compated to a number of existing morphology taggers: deeppavlov, deeppavlov_bert, rupostagger, rnnmorph, maru, udpipe, spacy, stanza.
  > Morphology annotator processes tokenized text. To split the input into sentencies and tokens use Razdel.

**9. naeval/docker/deeppavlov-ner-ru-bert/Dockerfile at master · natasha/naeval**
- URL: https://github.com/natasha/naeval/blob/master/docker/deeppavlov-ner-ru-bert/Dockerfile
- Comparing quality and performance of NLP systems for Russian language - naeval/docker/deeppavlov-ner-ru-bert/Dockerfile at master · natasha/naeval
  > Comparing quality and performance of NLP systems for Russian language - natasha/naeval

**10. naeval/docker/deeppavlov-ner-ru/Dockerfile at master · natasha/naeval**
- URL: https://github.com/natasha/naeval/blob/master/docker/deeppavlov-ner-ru/Dockerfile
- Comparing quality and performance of NLP systems for Russian language - naeval/docker/deeppavlov-ner-ru/Dockerfile at master · natasha/naeval
  > Comparing quality and performance of NLP systems for Russian language - natasha/naeval


## q02 — ""rubert" OR "sbert" russian semantic similarity embedding pypi 2025"

**Meta:** original='"rubert" OR "sbert" russian semantic similarity embedding pypi 2025'

### 🔎 Web (10 results)

**1. The Russian-focused embedders’ exploration: ruMTEB benchmark and Russian embedding model design**
- URL: https://arxiv.org/html/2408.12503v1
- Text embeddings play an important role in many Natural Language Processing (NLP) tasks, from clustering to semantic textual similarity (STS) and information retrieval (IR). The community has addressed this demand by releasing several powerful text embedding models (or embedders) Wang et al. (2024, 2023a); Chen et al. (2024). However, there is still a lack of such embedders developed specifically f
- Age: August 22, 2024
  > Text embeddings play an important role in many Natural Language Processing (NLP) tasks, from clustering to semantic textual similarity (STS) and information retrieval (IR). The community has addressed this demand by releasing several powerful text embedding models (or embedders) Wang et al. (2024, 2023a); Chen et al. (2024). However, there is still a lack of such embedders developed specifically for the Russian language. The most popular Russian-oriented models, such as rubert-tiny2 222https://h
  > Scaling the number of languages supported (including Russian) has been demonstrated in mE5 Wang et al. (2024) models and BGE-M3 Chen et al. (2024), thereby extending their applicability in multilingual contexts. The Russian-oriented models are mainly represented by SBERT models and rubert-tiny2 and their modifications.
  > Embedding models play a crucial role in Natural Language Processing (NLP) by creating text embeddings used in various tasks such as information retrieval and assessing semantic text similarity. This paper focuses on research related to embedding models in the Russian language.
  > It introduces a new Russian-focused embedding model called ru-en-RoSBERTa and the ruMTEB benchmark, the Russian version extending the Massive Text Embedding Benchmark (MTEB). Our benchmark includes seven categories of tasks, such as semantic textual similarity, text classification, reranking, and retrieval.

**2. DeepPavlov/rubert-base-cased-sentence · Hugging Face**
- URL: https://huggingface.co/DeepPavlov/rubert-base-cased-sentence
- It is initialized with RuBERT and fine‑tuned on SNLI[1] google-translated to russian and on russian part of XNLI dev set[2]. Sentence representations are mean pooled token embeddings in the same manner as in Sentence‑BERT[3].
  > It is initialized with RuBERT and fine‑tuned on SNLI[1] google-translated to russian and on russian part of XNLI dev set[2]. Sentence representations are mean pooled token embeddings in the same manner as in Sentence‑BERT[3].
  > Sentence RuBERT (Russian, cased, 12-layer, 768-hidden, 12-heads, 180M parameters) is a representation‑based sentence encoder for Russian.

**3. GitHub - flipz357/S3BERT: Semantically Structured Sentence Embeddings · GitHub**
- URL: https://github.com/flipz357/S3BERT
- It contains updated, streamlined, cleaned and maintained code, and allows install via pypi. Code for generating and training sentence embeddings with semantic features. Two main goals: increase interpretability of sentence embeddings and explain ...
  > For both SBERT and S3BERT the similarity for every pair is calculated on the full embeddings (cosine).
  > If you would like to train an interpretable embedding model from scratch, please also check out our XPLAINSIM software package. It contains updated, streamlined, cleaned and maintained code, and allows install via pypi. Code for generating and training sentence embeddings with semantic features. Two main goals: increase interpretability of sentence embeddings and explain similarity
  > quant_sim: Similarity w.r.t.\ quantificational structure similarity of sentences(three vs. four, a vs. all, etc.) score_wlk: see Smatch, but measured with contextual Weisfeiler Leman Kernel isntead of Smatch · score_wwlk: See Smatch, but measured with Wasserstein Weisfeiler Leman Kernel instead of Smatch · If you find the work interesting, consider citing: @article{opitz2022sbert, title={SBERT studies Meaning Representations: Decomposing Sentence Embeddings into Explainable Semantic Features}, a
  > In our paper, we define metrics between abstract meaning representations (AMRs) such that we can measure, e.g., coreference or quantification similarity of sentences and see how these sub-similarities modulate the overall similarity.

**4. ruMTEB benchmark and Russian embedding model design**
- URL: https://aclanthology.org/2025.naacl-long.12.pdf
- clustering to semantic textual similarity (STS) and · information retrieval (IR). The community has ad- dressed this demand by releasing several powerful · text embedding models (or embedders) (Wang · et al., 2024, 2023a; Chen et al., 2024). However, there is still a lack of such embedders developed · specifically for the Russian language. The most · popular Russian-oriented models, such as rubert
  > clustering to semantic textual similarity (STS) and · information retrieval (IR). The community has ad- dressed this demand by releasing several powerful · text embedding models (or embedders) (Wang · et al., 2024, 2023a; Chen et al., 2024). However, there is still a lack of such embedders developed · specifically for the Russian language. The most · popular Russian-oriented models, such as rubert- tiny2 1, SBERTlarge-nlu-ru2, and SBERTlarge-mt-nlu-ru3, have been released several years ago and t
  > Task-oriented intrinsic evaluation of semantic textual · similarity.
  > Semantic Textual Similarity (STS).
  > 2016 task 1: Semantic textual similarity, monolin-

**5. Pre-trained embeddings — DeepPavlov 1.7.0 documentation**
- URL: https://docs.deeppavlov.ai/en/master/features/pretrained_vectors.html
- We are publishing several pre-trained BERT models: · RuBERT for Russian language

**6. An Artificial Intelligence Driven Semantic Similarity-Based Pipeline for Rapid Literature Review**
- URL: https://arxiv.org/html/2509.15292v1
- Reimers and Gurevych [5] introduced Sentence Bert (SBERT) for semantic similarity, which has become a baseline in many automated pipelines largely due to its efficient and accurate generation of sentence embeddings. SBERT enables precise comparison using cosine similarity.
- Age: September 18, 2025
  > Reimers and Gurevych [5] introduced Sentence Bert (SBERT) for semantic similarity, which has become a baseline in many automated pipelines largely due to its efficient and accurate generation of sentence embeddings. SBERT enables precise comparison using cosine similarity.
  ```json
  [9] Google, “Gemini 2.0 Flash Large Language Model,” 2025.
  ```
  ```json
  [10] B. Kang and Y. Shin, “Empirical Study of Zero-shot Keyphrase Extraction with Large Language Models,” in Proc. 31st Int. Conf. Comput. Linguistics, Abu Dhabi, UAE, Jan. 2025, pp. 3670–3686.
  ```
  ```json
  [Online]. Available: https://aclanthology.org/2025.coling-main.248/
  ```

**7. cointegrated/rubert-tiny2 · Hugging Face**
- URL: https://huggingface.co/cointegrated/rubert-tiny2
- This is an updated version of cointegrated/rubert-tiny: a small Russian BERT-based encoder with high-quality sentence embeddings.
  > This is an updated version of cointegrated/rubert-tiny: a small Russian BERT-based encoder with high-quality sentence embeddings.
  > For those who want to run the inference with VLLM, there is a vLLM-optimized version of this model: WpythonW/rubert-tiny2-vllm
  > # pip install transformers sentencepiece import torch from transformers import AutoTokenizer, AutoModel tokenizer = AutoTokenizer.from_pretrained("cointegrated/rubert-tiny2") model = AutoModel.from_pretrained("cointegrated/rubert-tiny2") # model.cuda() # uncomment it if you have a GPU def embed_bert_cls(text, model, tokenizer): t = tokenizer(text, padding=True, truncation=True, return_tensors='pt') with torch.no_grad(): model_output = model(**{k: v.to(model.device) for k, v in t.items()}) embedd
  > from sentence_transformers import SentenceTransformer model = SentenceTransformer('cointegrated/rubert-tiny2') sentences = ["привет мир", "hello world", "здравствуй вселенная"] embeddings = model.encode(sentences) print(embeddings)

**8. Evaluating Embedding-Based Similarity Models for Assessment of Open-Ended Questions | Springer Nature Link**
- URL: https://link.springer.com/chapter/10.1007/978-3-032-16848-1_14
- A dataset of 800 answers was collected from ten GenAI models across eight domain-specific questions. Each answer was graded by a human annotator, and four distinct models (SBERT, GPT, GPT-4o, Cohere) were used to calculate semantic similarity ...
  > A dataset of 800 answers was collected from ten GenAI models across eight domain-specific questions. Each answer was graded by a human annotator, and four distinct models (SBERT, GPT, GPT-4o, Cohere) were used to calculate semantic similarity between GenAI answers and reference materials.
  > Pecuchova, J., Drlik, M.: The role of generative artificial intelligence in the assessment of open-ended questions. In: Auer, M.E., Rüütmann, T. (eds.) ICL 2024. LNNS, vol. 1260, pp. 394–405. Springer, Cham (2025).
  > Pecuchová, J., Benko, Ľ. (2026). Evaluating Embedding-Based Similarity Models for Assessment of Open-Ended Questions. In: Guarda, T., Portela, F., Augusto, M.F. (eds) Advanced Research in Technologies, Information, Innovation and Sustainability. ARTIIS 2025.
  > Other embedding-based models failed to align with human annotations, often misclassifying grades and failing to identify strong or weak quality answers. These findings challenge the assumption that semantic similarity can serve as an alternative for human assessment in evaluating open-ended questions.

**9. python - How to compare sentence similarities using embeddings from BERT - Stack Overflow**
- URL: https://stackoverflow.com/questions/60492839/how-to-compare-sentence-similarities-using-embeddings-from-bert
- You should use instead a model pre-trained specifically for sentence similarity, such as Sentence-BERT. Sentence-BERT and several other pretrained models for sentence similarity are available in the sentence-transformers library (https://www.sbert.net/docs/pretrained_models.html), which is fully compatible with the amazing HuggingFace transformers library.
  > As a complement to dennlinger's answer, I'll add a code example from https://www.sbert.net/docs/usage/semantic_textual_similarity.html to compare sentence similarities using embeddings from BERT:
  > You should NOT use BERT's output as sentence embeddings for semantic similarity. BERT is not pretrained for semantic similarity, which will result in poor results, even worse than simple Glove Embeddings.
  > You should use instead a model pre-trained specifically for sentence similarity, such as Sentence-BERT. Sentence-BERT and several other pretrained models for sentence similarity are available in the sentence-transformers library (https://www.sbert.net/docs/pretrained_models.html), which is fully compatible with the amazing HuggingFace transformers library.
  > Firstly, what is the best way to extratc the semantic embedding from the BERT model?

**10. embcli-sbert · PyPI**
- URL: https://pypi.org/project/embcli-sbert/
- # get an embedding for an input ... embedding for an input by a community model. emb embed -m sbert/intfloat/multilingual-e5-small &quot;Embeddings are essential for semantic search and RAG apps.&quot; # calculate similarity score between two texts by all-MiniLM-L6-v2....
- Age: May 18, 2025
  > # get an embedding for an input text by another model, all-mpnet-base-v2. emb embed -m sbert/all-mpnet-base-v2 "Embeddings are essential for semantic search and RAG apps." # get an embedding for an input by a community model. emb embed -m sbert/intfloat/multilingual-e5-small "Embeddings are essential for semantic search and RAG apps." # calculate similarity score between two texts by all-MiniLM-L6-v2.
  > the default metric is cosine similarity. emb simscore -m sbert "The cat drifts toward sleep." "Sleep dances in the cat's eyes." 0.8031787421988659 · You can use the emb command to index documents and perform semantic search.
  > # the documents should be in a CSV file with two columns: id and text. the separator should be comma. emb ingest -m sbert -c catcafe -f <path-to-your-documents> # search for a query in the indexed documents. emb search -m sbert -c catcafe -q "Who's the naughtiest one?"
  > # multilingual search emb search -m sbert -c catcafe -q "一番のいたずら者は誰?" Found 5 results: Score: 0.3771080195010235, Document ID: 68, Text: Xavi: Xavi is an intelligent and agile cat, perhaps a sleek black or Oriental breed, quick on his feet and sharp in mind.


## q03 — "russian text quality scoring readability expertise metrics python"

**Meta:** original='russian text quality scoring readability expertise metrics python'

### 🔎 Web (10 results)

**1. py-readability-metrics · PyPI**
- URL: https://pypi.org/project/py-readability-metrics/
- Score text &quot;Readability&quot; with popular formulas and metrics including Flesch-Kincaid, Gunning Fog, ARI, Dale Chall, SMOG, Spache and more
  > Score the readability of text using popular readability formulas and metrics including: Flesch Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, Dale Chall Readability, Automated Readability Index (ARI), Coleman Liau Index, Linsear Write, SMOG, and SPACHE. 📗 · pip install py-readability-metrics python -m nltk.downloader punkt
  > The commonwealth of Pennsylvania uses Flesch-Kincaid Grade Level for scoring automobile insurance policies to ensure their texts are no higher than a ninth grade level of reading difficulty. Many other U.S. states also use Flesch-Kincaid Grade Level to score other legal documents such as business policies and financial forms.
  > The U.S. Department of Defense uses the Reading Ease test as the standard test of readability for its documents and forms. Florida requires that life insurance policies have a Flesch Reading Ease score of 45 or greater.

**2. GitHub - cdimascio/py-readability-metrics: 📗 Score text readability using a number of formulas: Flesch-Kincaid Grade Level, Gunning Fog, ARI**
- URL: https://github.com/cdimascio/py-readability-metrics
- 📗 Score text readability using a number of formulas: Flesch-Kincaid Grade Level, Gunning Fog, ARI, Dale Chall, SMOG, and more - cdimascio/py-readability-metrics
  > pip install py-readability-metrics python -m nltk.downloader punkt

**3. textstat · PyPI**
- URL: https://pypi.org/project/textstat/
- Returns a grade level score for the given text. A value of 4 means very easy text, whereas 15 means very difficult text. ... Returns the number of syllables present in the given text.
  > Returns a grade level score for the given text. A value of 4 means very easy text, whereas 15 means very difficult text. ... Returns the number of syllables present in the given text. Uses the Python module Pyphen for syllable calculation in most languages, but defaults to nltk.corpus.cmudict for en_US.
  > Returns the Flesch Reading Ease Score.
  > The table is an example of values. While the maximum score is 121.22, there is no limit on how low the score can be.
  > A negative score is valid.

**4. Readability tests | Python**
- URL: https://campus.datacamp.com/courses/feature-engineering-for-nlp-in-python/basic-features-and-readability-scores?ex=8
- This exercise is part of the course · Learn to compute basic features such as number of words, number of characters, average word length and number of special characters (such as Twitter hashtags and mentions). You will also learn to compute readability scores and determine the amount of education ...
  > The index can be interpreted using this table. A score of 6 would indicate 6th grade reading difficulty whereas a score of 17 would indicate college graduate level reading difficulty. We can conduct these tests in Python using the readability metrics library.
  > Here is an example of Readability tests:
  > There are a variety of readability tests in use. Some of the common ones include the Flesch reading ease, the Gunning fog index, the simple measure of gobbledygook or SMOG and the Dale-Chall score. Note that these tests are used for texts in English. Tests for other languages also exist that take into consideration, the nuances of that particular language.
  > The Flesch Reading Ease is one of the oldest and most widely used readability tests. The score is based on two ideas: the first is that the greater the average sentence length, harder the text is to read. Consider these two sentences. The first is easier to follow than the second.

**5. Measuring the "readability" of texts with Large Language Models**
- URL: https://seantrott.substack.com/p/measuring-the-readability-of-texts
- To calculate Flesch-Kincaid, you just need an estimate of the number of words per sentence (which is pretty easy in languages like English, which separates words with spaces), as well as the number of syllables per word (which you can obtain from an electronic dictionary). In fact, the Python package textstat has working implementations of this formula (and others) in English, as well as other lan
- Age: February 2, 2024
  > To calculate Flesch-Kincaid, you just need an estimate of the number of words per sentence (which is pretty easy in languages like English, which separates words with spaces), as well as the number of syllables per word (which you can obtain from an electronic dictionary). In fact, the Python package textstat has working implementations of this formula (and others) in English, as well as other languages like French and Russian.
  > Some metrics of readability (like Linsear Write) were supposedly developed for the purpose of evaluating training manuals (e.g., for the Air Force). Speaking of accessibility, the Web Content Accessibility Guidelines (WCAG) include a requirement that text on the web be understandable and readable.
  > Thus, they used something called a Bradley-Terry model to convert those pairwise judgments into individual scores for each text excerpt. Intuitively, this works as follows: the more times text A is selected as more readable than another text, the more readable that text is; ultimately, each text is assigned a “readability coefficient” which represents (roughly) the proportion of times it is selected as more readable than its competitors.
  > This number was called the “BT (Bradley-Terry) Easiness” score. These numbers are standardized, so they range from about -3.67 to 1.71 (mean = -0.96, SD = 1.03). A more negative number means that a text is not very readable, while a more positive number means that a text is more readable.

**6. py-readability-metrics — py-readability-metrics 1.4.4 documentation**
- URL: https://py-readability-metrics.readthedocs.io/en/latest/
- Score the readability of text using popular readability metrics including: Flesch Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, Dale Chall Readability, Automated Readability Index (ARI), Coleman Liau Index, Lisnear Write, and SMOG · pip install py-readability-metrics python ...
  > Score the readability of text using popular readability metrics including: Flesch Kincaid Grade Level, Flesch Reading Ease, Gunning Fog Index, Dale Chall Readability, Automated Readability Index (ARI), Coleman Liau Index, Lisnear Write, and SMOG · pip install py-readability-metrics python -m nltk.downloader punkt

**7. [Textstat] How to evaluate readability?**
- URL: https://www.kaggle.com/code/yhirakawa/textstat-how-to-evaluate-readability
- Checking your browser before accessing www.kaggle.com · Click here if you are not automatically redirected after 5 seconds

**8. GitHub - mmautner/readability: a collection of functions that measure the readability of a given body of text**
- URL: https://github.com/mmautner/readability
- I&#x27;d recommend checking out the wikipedia articles below--most of the metrics estimate the grade level required to comprehend a given block of text and may return odd results on small snippets of text. To get up and running you&#x27;ll need NLTK and will need the punkt data set: shell$ pip install nltk shell$ python &gt;&gt;import nltk &gt;&gt;nltk.download(&#x27;punkt&#x27;)
  > I'd recommend checking out the wikipedia articles below--most of the metrics estimate the grade level required to comprehend a given block of text and may return odd results on small snippets of text. To get up and running you'll need NLTK and will need the punkt data set: shell$ pip install nltk shell$ python >>import nltk >>nltk.download('punkt')
  > The following readability metrics are included in readability.py:

**9. Readability Index in Python(NLP) - GeeksforGeeks**
- URL: https://www.geeksforgeeks.org/readability-index-pythonnlp/
- ASL = Average sentence length &quot;&quot;&quot; words = word_count(text) # Number of words not termed as difficult words count = word_count - difficult_words(text) if words &gt; 0: # Percentage of words not on difficult word list per = float(count) / float(words) * 100 # diff_words stores percentage of difficult words diff_words = 100 - per raw_score = (0.1579 * diff_words) + \ (0.0496 * avg_sent
- Age: September 3, 2021
  > So, it is required that the content be easy enough to read and understand this is as readable as possible. There are various available Difficulty Scales with their own difficulty determining formulae. This article illustrates various traditional readability formulae available for readability score evaluation.
  > Help us improve. Share your suggestions to enhance the article. Contribute your expertise and make a difference in the GeeksforGeeks portal.
  > Enhance the article with your expertise.
  > ASL = Average sentence length """ words = word_count(text) # Number of words not termed as difficult words count = word_count - difficult_words(text) if words > 0: # Percentage of words not on difficult word list per = float(count) / float(words) * 100 # diff_words stores percentage of difficult words diff_words = 100 - per raw_score = (0.1579 * diff_words) + \ (0.0496 * avg_sentence_length(text)) # If Percentage of Difficult Words is greater than 5 %, then; # Adjusted Score = Raw Score + 3.6365

**10. readability · PyPI**
- URL: https://pypi.org/project/readability/
- Measure the readability of a given text using surface characteristics
  > The quality of preprocessing affects the validity of the results.


## q04 — "YandexGPT 5 Lite Pro Reasoning API цена за токены 2026"

**Meta:** original='YandexGPT 5 Lite Pro Reasoning API цена за токены 2026'

### 🔎 Web (10 results)

**1. Yandex GPT 5 Lite: Обзор, Возможности и Цены 2026 | FICHI.AI**
- URL: https://fichi.ai/yandexgpt-lite
- Компактная модель от Яндекса: контекст 32K, встроенный поиск, лучшее понимание русского языка. $2 за 1M токенов на FICHI.AI.
- Age: March 9, 2026
  > Компактная модель от Яндекса: контекст 32K, встроенный поиск, лучшее понимание русского языка. $2 за 1M токенов на FICHI.AI.
  > Попробуйте Yandex GPT 5 Lite через FICHI.AI с оплатой российскими картами. Нужен более высокий уровень качества? Рассмотрите Yandex GPT 5.1 Pro по цене $4 за 1M токенов.
  > Для задач с русскоязычным контентом — описания товаров, маркетинговые тексты, деловая переписка, анализ российской документации — Yandex GPT 5 Lite предпочтительнее: лучше понимает контекст и возвращает более точные ответы на русском языке. Обе модели доступны на FICHI.AI в одном окне. При цене $2 за 1M токенов — самый экономичный способ получить качественную работу с русским языком.
  > Yandex GPT 5 Lite и Yandex GPT 5 Preview — модели схожего уровня по цене ($2 за 1M токенов), но с разными характеристиками.

**2. YandexGPT Pro 5 API: доступ из России, цены и характеристики | RouterAI ✨**
- URL: https://routerai.ru/models/yandex/gpt-pro-5
- Подключите YandexGPT Pro 5 через единый API. Контекст 1M токенов. Оплата в рублях. Стабильный доступ для разработчиков и бизнеса.
  > Оплата производится по факту за использованные токены.
  > Токены, полученные и обработанные моделью при анализе пользовательского запроса и контекста.
  > Токены, генерируемые моделью в виде ответа пользователю.
  > Каждый символ, слово или часть ответа, созданные моделью, включаются в подсчёт выходных токенов.

**3. YandexGPT Pro - тарифы и платный доступ к API на агрегаторе нейросетей**
- URL: https://xtool.ru/ai/tariff/yandexgpt-pro/
- При сравнении тарифов важны цена за запрос, календарные ограничения, наличие SLA, методы аутентификации и поддержка требуемых регионов. YandexGPT тарифы отличаются по количеству токенов, скорости отклика и опциям кастомизации.
  > Обзор тарифов YandexGPT Pro, варианты покупки, стоимость и порядок получения платного доступа к API. Сравнение предложений на агрегаторе нейросетей и ссылки на тарифы и документацию.
  > При сравнении тарифов важны цена за запрос, календарные ограничения, наличие SLA, методы аутентификации и поддержка требуемых регионов. YandexGPT тарифы отличаются по количеству токенов, скорости отклика и опциям кастомизации.

**4. YandexGPT in 2026: A Review of Russia's AI Platform for Business | mysummit.school - AI for Managers Blog**
- URL: https://mysummit.school/blog/en/yandexgpt-review-2026/
- YandexGPT review in 2026: models 5.1 Pro and Alice AI, Shedevrum, Yandex 360 integration, pricing, and practical applications for managers
- Age: 3 weeks ago
  > The basic version of YandexGPT is available for free through Alice and Yandex Browser. Since July 2025, most advanced features in “Chat with Alice” powered by the Pro model – including reasoning mode and file handling – have also become free.
  > Supports Chain-of-Reasoning mode – similar to reasoning models (o3, DeepSeek R1).
  > Alice AI LLM turned out to be the strongest Russian-made model overall. It handles analytical and problem-solving tasks reasonably well and sits in the mid-to-lower tier globally.

**5. 🔍 Сравнение цен API языковых моделей Разбираемся в ценах на API популярных языковых моделей и находим оптимальные варианты для разных потреб**
- URL: https://setka.ru/posts/0195b929-3ca0-4be6-87bb-257409a16c8e
- Зависит от того, что ... запроса) 1.5 Pro: Умные задачи — $1.25-$2.50/$5-$10 (до 128K токенов — дешевле, больше — дороже)...
  > Бесплатно для физлиц: 50 тысяч токенов на год Для юрлиц и больших пакетов (от 200M) цена падает ➡️ Yandex Cloud (синхронный/асинхронный) YandexGPT 3 Lite: Эконом — 200 ₽ / 120 ₽ .
  > Зависит от того, что используете (текст, картинки, аудио) 1.5 Flash-8B: Лёгкие задачи — $0.0375-$0.075/$0.15-$0.30 (зависит от размера запроса: ниже 128K токенов — дешевле, выше — дороже) 1.5 Flash: Быстрые задачи — $0.075-$0.15/$0.30-$0.60 (зависит от размера запроса) 1.5 Pro: Умные задачи — $1.25-$2.50/$5-$10 (до 128K токенов — дешевле, больше — дороже)

**6. YandexGPT: обзор моделей, цен и возможностей в 2026 году**
- URL: https://toolarium.ru/yandexgpt-obzor-vozmozhnosti/
- Обзор YandexGPT 5, Alice AI LLM и Yandex AI Studio. Цены API, сравнение с GigaChat, интеграция с Алисой AI и Яндекс Браузером. Данные на март 2026.
- Age: 1 month ago
  > YandexGPT — языковая модель Яндекса, встроенная в Алису и Яндекс Облако. Обзор возможностей и ограничений.
  > Яндекс — вторая российская компания (после Сбера с GigaChat), которая разработала и запустила собственную LLM для массового использования. К 2026 году YandexGPT интегрирован в десятки продуктов экосистемы Яндекса.
  > Яндекс развивает несколько поколений YandexGPT. Основные версии в 2026 году:
  > YandexGPT доступен через Yandex Foundation Models в Yandex Cloud. Для начала работы нужен аккаунт Яндекс Cloud, создание папки и IAM-токен или API-ключ.

**7. Yandex GPT 5 Preview: Обзор, Возможности и Цены 2026 | FICHI.AI**
- URL: https://fichi.ai/yandexgpt-lite-5
- Yandex GPT 5 Preview — российская языковая модель с контекстом 32K, встроенным поиском, $2 за 1M токенов. Оптимизирована для русского языка. На FICHI.AI.
- Age: March 9, 2026
  > Обзор Yandex GPT 5 Preview: контекст 32K, встроенный поиск, вызов инструментов. Оптимизирована для русского языка. На FICHI.AI.
  > При $2 за 1M токенов — одна из самых экономичных российских моделей. Полный рейтинг 100 нейросетей · Последнее обновление статьи: ... Официальный сайт Яндекс.Облако,Документация YandexGPT,Журнал изменений,Рейтинг нейросетей FICHI.AI,
  > Попробуйте Yandex GPT 5 Preview через FICHI.AI с оплатой российскими картами. Нужен более высокий уровень качества? Рассмотрите Yandex GPT 5.1 Pro по цене $4 за 1M токенов.
  > Yandex GPT 5.1 Pro — стабильная продвинутая версия с 71% хороших ответов, структурированным выводом в формате JSON и работой с базами знаний за $4 за 1M токенов.

**8. Yandex GPT 5 Pro: Обзор, Возможности и Цены 2026 | FICHI.AI**
- URL: https://fichi.ai/yandexgpt-5
- Попробуйте Yandex GPT ...дневных задач? Рассмотрите Yandex GPT 5 Lite по цене $2 за 1M токенов....
- Age: August 22, 2024
  > Yandex GPT 5 Pro: контекст 32K, встроенный поиск, нативный русский язык. Понимает российское законодательство и бизнес-контекст. На FICHI.AI.
  > Попробуйте Yandex GPT 5 Pro через FICHI.AI с оплатой российскими картами. Нужна более лёгкая версия для повседневных задач? Рассмотрите Yandex GPT 5 Lite по цене $2 за 1M токенов.
  > Yandex GPT 5.1 Pro — обновлённая версия с улучшенным качеством: доля хороших ответов выросла с 60% до 71%, некорректных снизилась с 32% до 16%, а цена уменьшилась с $12 до $4 за 1M токенов — в три раза дешевле при лучшем качестве.
  > Yandex GPT 5 Pro — предыдущая флагманская версия по цене $12 за 1M токенов с теми же 32 768 токенами контекста (≈24 страницы текста) и встроенным поиском. Ключевое отличие — в точности ответов и стоимости.

**9. Правила тарификации для Yandex Foundation Models**
- URL: https://yandex.cloud/ru/docs/foundation-models/pricing
- We cannot provide a description for this page right now

**10. Yandex B2B Tech открыл доступ к флагманской модели YandexGPT 5.1 Pro для бизнеса**
- URL: https://www.tadviser.ru/index.php/%D0%9F%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82:YandexGPT
- Продукт YandexGPT, Открытие доступа к YandexGPT 51 Pro, В основе ИИ-помощника умных часов Aimoto BuddyGPT, Соответствие процессов разработки требованиям стандарта ISO/IEC 42001, Доступ к Instruct-версии YandexGPT 5 Lite, Возможность дообучения методом LoRA, Открытый доступ YandexGPT 5 Lite Pretrain, Запуск YandexGPT 5 Pro, Внедрение в &quot;Речевую аналитику&quot; Mango Office, Внедрение в &quot;Ю
- Age: August 29, 2025
  > Продукт YandexGPT, Открытие доступа к YandexGPT 51 Pro, В основе ИИ-помощника умных часов Aimoto BuddyGPT, Соответствие процессов разработки требованиям стандарта ISO/IEC 42001, Доступ к Instruct-версии YandexGPT 5 Lite, Возможность дообучения методом LoRA, Открытый доступ YandexGPT 5 Lite Pretrain, Запуск YandexGPT 5 Pro, Внедрение в "Речевую аналитику" Mango Office, Внедрение в "Юниверс DG
  > Конференция TAdviser «СЭД и ECM Day 2026»: эксперты обсудили опыт внедрения и развития СЭД, ECM, CSP, ИИ в ЭДО
  > Импортозамещение без иллюзий: к чему готовиться рынку электроники в 2026 году
  > Конференция TAdviser «Цифровизация бизнес-процессов 2026» 22 апреля

### ❓ FAQ (11)

**Q: Для каких задач подходит Yandex GPT 5 Lite?**
A: Маркетинговые тексты, посты для соцсетей, коммерческие предложения, описания товаров, HR-документы.
*Source: fichi.ai*

**Q: Чем Yandex GPT 5 Lite отличается от Yandex GPT 5 Preview?**
A: Lite — стабильная релизная версия, Preview — предрелизная с вызовом инструментов. Цена одинаковая.
*Source: fichi.ai*

**Q: Чем Yandex GPT 5 Pro отличается от Yandex GPT 5.1 Pro?**
A: Yandex GPT 5.1 Pro — обновлённая версия с улучшенным качеством ответов и более низкой ценой $4 за 1M токенов.
*Source: fichi.ai*

**Q: Чем Yandex GPT 5 Preview отличается от Yandex GPT 5.1 Pro?**
A: Preview — предрелизная версия для повседневных задач за $2/1M токенов. 5.1 Pro — продвинутая с 71% хороших ответов за $4/1M токенов.
*Source: fichi.ai*

**Q: Как подключить Yandex GPT 5 Pro через программный интерфейс?**
A: Через FICHI.AI подключение занимает несколько минут без регистрации в Яндекс.Облаке.
*Source: fichi.ai*


## q05 — "yandex.ru/dev/foundation-models yandexgpt pricing rate limits"

**Meta:** original='yandex.ru/dev/foundation-models yandexgpt pricing rate limits'

### 🔎 Web (10 results)

**1. Yandex Cloud Documentation | Yandex Foundation Models | Yandex Foundation Models pricing policy**
- URL: https://yandex.cloud/en/docs/foundation-models/pricing
- The same 770-token text classified with YandexGPT Pro or a fine-tuned classifier will be billed as four requests. The cost of text vectorization (getting text embeddings) depends on the size of the text submitted for vectorization. At the Preview stage, you can use AI Assistant API and store files free of charge; however, you will be charged for models according to the text generation rules.
  > Prices in Russian roubles are applicable to customers of Yandex.Cloud LLC. In the management console, new users without a billing account have access to models for testing: YandexGPT Lite and YandexGPT Pro: 10 free requests per hour. YandexART: 10 free requests per day. In Yandex Cloud Billing, Foundation Models usage is detailed in billing units.
  > Prices for Yandex Cloud resources vary based on the region. For more information about the available regions, see Regions. The currency you can use to pay for the resources depends on which legal entity you entered into agreement with. For more information on creating an account, see Registering an account in Yandex Cloud. ... With models in batch mode, the minimum cost per run is 200,000 tokens. Cost of using YandexGPT Lite for text generation with the following parameters:
  > The same 770-token text classified with YandexGPT Pro or a fine-tuned classifier will be billed as four requests. The cost of text vectorization (getting text embeddings) depends on the size of the text submitted for vectorization. At the Preview stage, you can use AI Assistant API and store files free of charge; however, you will be charged for models according to the text generation rules.
  > Price per 1,000 tokens for the YandexGPT Pro model, asynchronous mode: $0.005001. Number of units per token for the YandexGPT Pro model, asynchronous mode: 3. Total number of units in usage details: 1,615 × 3 = 4,845. Total: ($0.005001 / 1,000 tokens) × 1,615 tokens = $0.008077. Cost of using YandexGPT Pro and DataSphere for text generation with the following parameters:

**2. Yandex Cloud Documentation | Yandex AI Studio | Yandex AI Studio pricing policy**
- URL: https://yandex.cloud/en/docs/ai-studio/pricing
- The price per 1 unit for a dedicated instance is $0.0083333 without VAT. At the Preview stage, you can fine-tune models free of charge. A fine-tuned YandexGPT Lite model will cost the same as the basic YandexGPT Lite model.
- Age: March 4, 2026
  > Price per 1,000 tokens for the YandexGPT Pro model, asynchronous mode: $0.005001. Number of units per token for the YandexGPT Pro model, asynchronous mode: 3. Total number of units in usage details: 1,615 × 3 = 4,845. Total: ($0.005001 / 1,000 tokens) × 1,615 tokens = $0.008077. With models in batch mode, the minimum cost per run is 200,000 tokens.
  > The price per 1 unit for a dedicated instance is $0.0083333 without VAT. At the Preview stage, you can fine-tune models free of charge. A fine-tuned YandexGPT Lite model will cost the same as the basic YandexGPT Lite model.
  > Prices in Russian roubles are applicable to customers of Yandex.Cloud LLC. All prices below do not include VAT. ... Yandex Cloud resources are priced differently in different regions. For more information about the available regions, see Regions. Your payment currency is determined by your contracting legal entity. For more information on creating an account, see Registering an account in Yandex Cloud. The cost of using Model Gallery models depends on:
  > The cost of text classification depends on the classification model you use and the number of tokens you provide. When classifying with YandexGPT Lite, a billing unit is a request of up to 1,000 tokens.

**3. YandexGPT and Foundation Models | yandex-cloud/docs | DeepWiki**
- URL: https://deepwiki.com/yandex-cloud/docs/7.2-datalens-and-message-queue
- Alternative SKU: Some models use foundation_models.text_generation_alt.v1 for pricing calculations. Asynchronous mode offers 50% discount on all tokens: Note: Open-source models (Qwen3, gpt-oss-*, Gemma3) do not support asynchronous mode. Sources: ru/_pricing/yandexgpt/rub-generating_new.md1-13 en/_pricing/yandexgpt/usd-generating_new.md1-13 ru/_pricing/yandexgpt/kzt-generating_new.md1-13
- Age: December 23, 2025
  > Sources: ru/presets.yaml19 ru/presets.yaml361 ru/_pricing/yandexgpt/rub-generating_new.md3 ru/_pricing/yandexgpt/rub-generating_new.md7-10 ... Llama was created by Meta. Meta is designated as an extremist organization and its activities are prohibited in Russia. ... AI Studio (ai-studio-name) provides a unified interface for managing foundation models and AI workflows: ... DataSphere (ml-platform-name) is the machine learning development platform integrated with YandexGPT APIs:
  > Alternative SKU: Some models use foundation_models.text_generation_alt.v1 for pricing calculations. Asynchronous mode offers 50% discount on all tokens: Note: Open-source models (Qwen3, gpt-oss-*, Gemma3) do not support asynchronous mode. Sources: ru/_pricing/yandexgpt/rub-generating_new.md1-13 en/_pricing/yandexgpt/usd-generating_new.md1-13 ru/_pricing/yandexgpt/kzt-generating_new.md1-13
  > The YandexGPT and Foundation Models ecosystem provides access to generative AI capabilities through REST and gRPC APIs hosted at llm.api.cloud.yandex.net. The system offers multiple LLM models with different performance characteristics, synchronous and asynchronous execution modes, and integration with the DataSphere ML platform for custom model development. Sources: ru/presets.yaml44 ru/presets.yaml913-914 en/presets.yaml225-226
  > The YandexGPT API is accessible through the llm.api.cloud.yandex.net endpoint and supports both REST and gRPC protocols. The API provides two execution modes: Sources: ru/presets.yaml44 ru/_pricing/yandexgpt/rub-generating_new.md1-13

**4. Yandex Cloud Documentation | Yandex Foundation Models | Getting started with YandexGPT Lite and YandexGPT Pro**
- URL: https://yandex.cloud/en/docs/foundation-models/quickstart/yandexgpt
- maxTokens: Sets a limit on the model&#x27;s output in tokens. The maximum number of tokens per generation depends on the model. For more information, see Quotas and limits in Yandex Foundation Models.
- Age: September 5, 2025
  > When accessing YandexGPT Lite or YandexGPT Pro via the API, provide the received parameters: In the request file, specify the folder ID in the modelUri parameter. In the request, specify the IAM token in the Authorization header. ... For information about other API authentication methods, see Authentication with the Yandex Foundation Models API.
  > In the list of services, select Foundation Models. In the left-hand panel, select YandexGPT Prompt mode.
  > maxTokens: Sets a limit on the model's output in tokens. The maximum number of tokens per generation depends on the model. For more information, see Quotas and limits in Yandex Foundation Models.
  > It withsatnds moisturre and mechanical dammage thanks to a 0.2 mm thick proctive layer of melamine films and a wax-treated interlocking system.""", }, ] def main(): sdk = YCloudML( folder_id="<folder_ID>", auth="<API_key>", ) result = ( sdk.models.completions("yandexgpt").configure(temperature=0.5).run(messages) ) for alternative in result: print(alternative) if __name__ == "__main__": main()

**5. YandexGPT - Yandex**
- URL: https://systems-analysis.ru/eng/YandexGPT_(language_model)
- ↑ 8.0 8.1 8.2 8.3 &quot;yandex/YandexGPT-5-Lite-8B-pretrain&quot;. Hugging Face. [8] ↑ &quot;ChatYandexGPT API Reference (max_tokens = 7400)&quot;. LangChain Docs. [9] ↑ &quot;Yandex Cloud service quotas and limits → Foundation Models&quot;. Yandex Cloud Docs. [10] ↑ &quot;llmarena/llmarena — a Russian crowdsourcing ...
- Age: December 15, 2025
  > YandexGPT (Yet another GPT) is a family of large language models developed by Yandex and first introduced in May 2023.[1] YandexGPT models are used in the Alisa voice assistant, Yandex Search, and other services, and are also available via the public API of the Yandex Cloud platform.[2] YaLM-100B (2022) was a preceding open-source research model with 100 billion parameters. It served as a "proof of concept," but YandexGPT was developed separately for commercial use.[3] ... Base architecture: Tra
  > ↑ 8.0 8.1 8.2 8.3 "yandex/YandexGPT-5-Lite-8B-pretrain". Hugging Face. [8] ↑ "ChatYandexGPT API Reference (max_tokens = 7400)". LangChain Docs. [9] ↑ "Yandex Cloud service quotas and limits → Foundation Models". Yandex Cloud Docs. [10] ↑ "llmarena/llmarena — a Russian crowdsourcing platform for LLM evaluation".
  > KazMMLU: Evaluating Language Models on Kazakh, Russian, and Regional Knowledge of Kazakhstan. arXiv:2502.12829. Noels, S. et al. (2025). What Large Language Models Do Not Talk About: An Empirical Study of Moderation and Censorship Practices. arXiv:2504.03803. ↑ 1.0 1.1 "Yandex adds ChatGPT analog to Alisa". RBC. [1] ↑ 2.0 2.1 "Getting started with YandexGPT (Quickstart)".
  > ru-LLM Arena: YandexGPT holds the leading position in ELO rating among Russian-language models.[11] The LoRA method is officially supported for 5 Lite; a usage example is published in the model card.[8] Synchronous — for fast responses (Lite). Asynchronous — for resource-intensive tasks (Pro).[2] The YandexGPT family remains text-based; multimodal services ("Neuro", "YandexArt", "Yandex Vision") are developed separately.[6]

**6. All YandexGPT models available in 2025: complete list for web, app, and API with generation 5 variants and developer access**
- URL: https://www.datastudios.org/post/all-yandexgpt-models-available-in-2025-complete-list-for-web-app-and-api-with-generation-5-varian
- The key distinction is that Alice auto-routes to the latest model, while developers on Yandex Cloud can explicitly select model type and generation. ... Both models are priced separately, and performance trade-offs are documented in the Foundation Models dashboard.
- Age: August 11, 2025
  > YandexGPT now powers the Alice assistant and offers Lite and Pro models through Yandex Cloud.As of August 2025, Yandex has consolidated its large language model deployment under the YandexGPT brand, available to both end users and developers. The public-facing Alice assistant now runs on the YandexGPT 3+ family, while generation 5 YandexGPT Lite and Pro are offered through the Foundation Models section of Yandex Cloud for API use.
  > Users do not select models manually—Alice automatically runs on the most current YandexGPT deployment, now described as generation 5 in internal documentation. The experience is consistent across platforms, and updates are invisible to the end user. Alice now supports long-form answers, follow-ups, and document parsing thanks to its integration with YandexGPT’s high-context architecture. For developers, Yandex offers full API access to its models through the Foundation Models section of Yandex C
  > The key distinction is that Alice auto-routes to the latest model, while developers on Yandex Cloud can explicitly select model type and generation. ... Both models are priced separately, and performance trade-offs are documented in the Foundation Models dashboard.
  > A full benchmarking comparison of Lite vs Pro vs previous gens is available through Yandex Cloud documentation. ... FOLLOW US FOR MORE. ... Grok Real-Time Search: How X Integration, Live Web Retrieval, Citations, and Agent Tools Turn xAI’s Model Into a Research Workflow System · Claude Code Explained: How Anthropic’s Terminal-First Coding Agent Works Across CLI Sessions, IDE Integrations, Shared Context, Hooks, Memory, and Long-Running Development Workflows

**7. YandexGPT by Yandex — Models, Pricing & API | LLM Reference**
- URL: https://www.llmreference.com/model-family/yandexgpt
- YandexGPT AI models by Yandex — 5 variants, up to 128K context. Compare pricing, benchmarks, and API access.
  > YandexGPT AI models by Yandex — 5 variants, up to 128K context. Compare pricing, benchmarks, and API access.
  > YandexGPT is a suite of large language models crafted by Yandex, a notable Russian tech firm. These models adhere to the GPT architecture, harnessing extensive datasets of text and code, spanning books, articles, and freely accessible online content 134. The family comprises a range of models with diverse capabilities, the standout being YaLM 100B, which contains 100 billion parameters and has been trained on 1.7 TB of English and Russian data 3.
  > The models undergo constant refinement, with successive updates enhancing response quality, reasoning faculties, and processing capacity 13. Yandex is committed to ethical AI progress, ensuring that its models engage with sensitive issues sagely and provide sourced information 12. ... The YandexGPT family contains 5 models.

**8. About Yandex Foundation Models**
- URL: https://cloud.yandex.com/en/docs/yandexgpt/concepts/models
- Platform overview, service documentation, and solution tutorials.
- Age: October 28, 2025

**9. Yandex makes the YandexGPT API available for all users worldwide**
- URL: https://yandex.com/company/news/01-19-12-2023
- The YandexGPT API is a Yandex Cloud service that unlocks the capabilities of generative language models for use in business apps and web services. YandexGPT 2, the latest version, is already available. Companies can also train the technology using their own data, and the service’s chat mode supports text dialog and remembers conversation context. In addition, YandexGPT uses embeddings in cloud env
  > Yandex unlocks access to the YandexGPT API via Yandex Cloud to all businesses globally. YandexGPT API features a large asynchronous model that's suited for solving complex text-related tasks. A simpler model for processing real-time queries, which includes responding to search queries and user questions, is also available.
  > After we finished testing and doing pilot runs for the YandexGPT API, we realized there was huge interest and a broad range of applications. Some companies go beyond automating specific business processes and use the neural network to develop IT products.
  > We’re excited to develop the products and services of our ecosystem for users across the globe. Yandex places particular value in creating helpful solutions that help companies automate their business processes and make the most of our technologies. Our hope is that this investment will prove invaluable to the digital community. YandexGPT API features a large asynchronous model that’s suited for solving complex text-related tasks.
  > The YandexGPT API is a Yandex Cloud service that unlocks the capabilities of generative language models for use in business apps and web services. YandexGPT 2, the latest version, is already available. Companies can also train the technology using their own data, and the service’s chat mode supports text dialog and remembers conversation context. In addition, YandexGPT uses embeddings in cloud environments, making it possible to work with vector databases and text data clustering. The YandexGPT 

**10. YandexGPT in 2026: A Review of Russia's AI Platform for Business | mysummit.school - AI for Managers Blog**
- URL: https://mysummit.school/blog/en/yandexgpt-review-2026/
- YandexGPT review in 2026: models 5.1 Pro and Alice AI, Shedevrum, Yandex 360 integration, pricing, and practical applications for managers
- Age: 3 weeks ago
  > They run faster and are cheaper, but with limited capabilities. Ideal for chatbots, quick queries, and bulk operations. Shedevrum is Yandex’s neural network for creating images and videos (up to 6 seconds in 16:9, 9:16, and 1:1 formats). Yandex Shedevrum: an example of a prompt-generated image ... Access through Alice – use YandexGPT via the voice assistant on smartphones, smart speakers, and other devices.
  > Video transcription service – 300.ya.ru. Built-in video transcription and summarization in Yandex Browser. Alice Pro – a Google Workspace-like AI solution – lets you work with data from your subscription. The basic version of YandexGPT is available for free through Alice and Yandex Browser. Since July 2025, most advanced features in “Chat with Alice” powered by the Pro model – including reasoning mode and file handling – have also become free. For developers (via Yandex Cloud, AI Studio, startin
  > YandexGPT with the Yandex 360 ecosystem is a convenient tool for working with documents and legislation in Russian. In our course, we cover how to build a workflow with Russian AI services – even when quality still lags behind global leaders. ... We tested YandexGPT models as part of our independent benchmark across real-world management tasks – analysis, team leadership, learning and development, and problem-solving.
  > Quality trails global leaders – in independent tests, YandexGPT falls behind ChatGPT 5 and Claude 4.6, although the gap is minimal for Russian-language tasks. Ecosystem lock-in – full capabilities are unlocked only within the Yandex ecosystem. Limited context – 128K tokens vs 1M for Claude and 2M for Gemini.

### 💬 Discussions (1)

**1. Yandex open sources 100B GPT-like model**
- URL: https://www.reddit.com/r/programming/comments/vit8xs/yandex_open_sources_100b_gptlike_model/
- PSA: Yandex is a multi-billion Moscow based company, finances the Russian war of aggression in Ukraine, and is one of the main Kremlin's tool in spreading propaganda and suppressing dissent .

### ❓ FAQ (3)

**Q: What is the latest YandexGPT model?**
A: The latest model is YandexGPT 5.1 Pro, released in 2025-08.
*Source: www.llmreference.com*

**Q: What is YandexGPT?**
A: YandexGPT is a suite of large language models crafted by Yandex, a notable Russian tech firm. These models adhere to the GPT architecture, harnessing extensive datasets of text and code, spanning books, articles, and freely accessible online content 134. The family comprises a range of models with diverse capabilities, the standout being YaLM 100B, which contains 100 billion parameters and has bee
*Source: www.llmreference.com*

**Q: How many models are in the YandexGPT family?**
A: The YandexGPT family contains 5 models.
*Source: www.llmreference.com*


## q06 — "yandex-cloud-ml-sdk python YandexGPT example completion"

**Meta:** original='yandex-cloud-ml-sdk python YandexGPT example completion'

### 🔎 Web (10 results)

**1. Yandex Cloud ML SDK**
- URL: https://github.com/yandex-cloud/yandex-cloud-ml-sdk
- from yandex_ai_studio_sdk import AIStudio sdk = AIStudio(folder_id=&quot;...&quot;, auth=&quot;&lt;APIKey/IAMToken/SomethingElse&gt;&quot;) model = sdk.models.completions(&#x27;yandexgpt&#x27;) model = model.configure(temperature=0.5) result = model.run(&quot;foo&quot;) for alternative in result: print(alternative)
  > Yandex AI Studio SDK offers a comprehensive set of high‑level abstractions that map directly to the capabilities exposed by Yandex Cloud. The current feature set includes: ... Text generation (completion) models with streaming support.
  > This Python library provides a simple and efficient software development kit (SDK) for interacting with Yandex Cloud AI Studio services.
  > from yandex_ai_studio_sdk import AIStudio sdk = AIStudio(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt') model = model.configure(temperature=0.5) result = model.run("foo") for alternative in result: print(alternative)
  > from yandex_ai_studio_sdk import AIStudio from langchain_core.messages import AIMessage, HumanMessage sdk = AIStudio(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt').langchain() langchain_result = model.invoke([ HumanMessage(content="hello!"), AIMessage(content="Hi there human!"), HumanMessage(content="Meow!"), ])

**2. Yandex Cloud Documentation | Yandex Foundation Models | Getting started with YandexGPT Lite and YandexGPT Pro**
- URL: https://yandex.cloud/en/docs/foundation-models/quickstart/yandexgpt
- In the left-hand panel, select YandexGPT Prompt mode. In the Temperature field, enter a value between 0 and 1 for the model&#x27;s response variability. With a higher value, you get a less deterministic result.
- Age: September 5, 2025
  > Use the pip package manager to install the ML SDK library: ... To use the examples of requests via the API, install cURL. To work with the YandexGPT API, you need to get authenticated using your account:
  > In the left-hand panel, select YandexGPT Prompt mode. In the Temperature field, enter a value between 0 and 1 for the model's response variability. With a higher value, you get a less deterministic result. Describe the request context under Instructions. Enter your prompt to the model under Request. Click View answer. The response will appear on the right side of the screen. Create a file named generate-text.py and paste the following code into it: #!/usr/bin/env python3 from __future__ import a
  > It withsatnds moisturre and mechanical dammage thanks to a 0.2 mm thick proctive layer of melamine films and a wax-treated interlocking system.""", }, ] def main(): sdk = YCloudML( folder_id="<folder_ID>", auth="<API_key>", ) result = ( sdk.models.completions("yandexgpt").configure(temperature=0.5).run(messages) ) for alternative in result: print(alternative) if __name__ == "__main__": main() ... As input data for a request, Yandex Cloud ML SDK can accept a string, a dictionary, an object of the
  > For more information, see Yandex Cloud ML SDK usage. messages: List of messages that set the context for the model: ... assistant: Used for responses generated by the model. In chat mode, the model's responses tagged with the assistant role are included in the message to save the conversation context. Do not send user messages with this role. ... The following examples use API key authentication. Yandex Cloud ML SDK also supports IAM token and OAuth token authentication.

**3. docs/ru/_includes/foundation-models/examples/yandexgpt-stream-sdk.md at master · yandex-cloud/docs**
- URL: https://github.com/yandex-cloud/docs/blob/master/ru/_includes/foundation-models/examples/yandexgpt-stream-sdk.md
- #!/usr/bin/env python3 from __future__ import annotations from yandex_cloud_ml_sdk import YCloudML messages = [ {&quot;role&quot;: &quot;system&quot;, &quot;text&quot;: &quot;Найди ошибки в тексте и исправь их&quot;}, {&quot;role&quot;: &quot;user&quot;, &quot;text&quot;: &quot;Ашипки саме сибя ни исрпвят.&quot;}, ] def main(): sdk = YCloudML( folder_id=&quot;&lt;идентификатор_каталога&gt;&quot;, 
  > #!/usr/bin/env python3 from __future__ import annotations from yandex_cloud_ml_sdk import YCloudML messages = [ {"role": "system", "text": "Найди ошибки в тексте и исправь их"}, {"role": "user", "text": "Ашипки саме сибя ни исрпвят."}, ] def main(): sdk = YCloudML( folder_id="<идентификатор_каталога>", auth="<API-ключ>", ) model = sdk.models.completions("yandexgpt") for result in model.configure(temperature=0.5).run_stream(messages): for alternative in result: print(alternative) if __name__ == "

**4. GitHub - yandex-cloud/yandex-ai-studio-sdk · GitHub**
- URL: https://github.com/yandex-cloud/yandex-ai-studio-sdk
- from yandex_ai_studio_sdk import AIStudio from langchain_core.messages import AIMessage, HumanMessage sdk = AIStudio(folder_id=&quot;...&quot;, auth=&quot;&lt;APIKey/IAMToken/SomethingElse&gt;&quot;) model = sdk.models.completions(&#x27;yandexgpt&#x27;).langchain() langchain_result = model.invoke([ HumanMessage(content=&quot;hello!&quot;), AIMessage(content=&quot;Hi there human!&quot;), HumanMessa
  > Yandex AI Studio SDK offers a comprehensive set of high‑level abstractions that map directly to the capabilities exposed by Yandex Cloud. The current feature set includes: ... Text generation (completion) models with streaming support.
  > This Python library provides a simple and efficient software development kit (SDK) for interacting with Yandex Cloud AI Studio services.
  > from yandex_ai_studio_sdk import AIStudio sdk = AIStudio(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt') model = model.configure(temperature=0.5) result = model.run("foo") for alternative in result: print(alternative)
  > from yandex_ai_studio_sdk import AIStudio from langchain_core.messages import AIMessage, HumanMessage sdk = AIStudio(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt').langchain() langchain_result = model.invoke([ HumanMessage(content="hello!"), AIMessage(content="Hi there human!"), HumanMessage(content="Meow!"), ])

**5. Yandex Cloud Documentation | Yandex Foundation Models | How to build a chat with YandexGPT Lite or YandexGPT Pro**
- URL: https://yandex.cloud/en/docs/foundation-models/operations/yandexgpt/create-chat
- #!/usr/bin/env python3 from __future__ import annotations from yandex_cloud_ml_sdk import YCloudML messages = [ { &quot;role&quot;: &quot;system&quot;, &quot;text&quot;: &quot;You are a smart assistant&quot;, }, { &quot;role&quot;: &quot;user&quot;, &quot;text&quot;: &quot;Hi! What fields of science did Albert Einstein study?&quot;, }, ] def main(): sdk = YCloudML( folder_id=&quot;&lt;folder_ID&gt
  > To create a chat with a model in your application and avoid delays in responses, send prompts in synchronous mode using the completion method or Yandex Cloud ML SDK.
  > #!/usr/bin/env python3 from __future__ import annotations from yandex_cloud_ml_sdk import YCloudML messages = [ { "role": "system", "text": "You are a smart assistant", }, { "role": "user", "text": "Hi! What fields of science did Albert Einstein study?", }, ] def main(): sdk = YCloudML( folder_id="<folder_ID>", auth="<API_key>", ) result = ( sdk.models.completions("yandexgpt").configure(temperature=0.6).run(messages) ) for alternative in result: print(alternative) if __name__ == "__main__": main
  > For more information, see Yandex Cloud ML SDK usage. messages: List of messages that set the context for the model: ... assistant: Used for responses generated by the model. In chat mode, the model's responses tagged with the assistant role are included in the message to save the conversation context. Do not send user messages with this role. ... The following examples use API key authentication. Yandex Cloud ML SDK also supports IAM token and OAuth token authentication.
  > For more information, see Authentication in Yandex Cloud ML SDK.

**6. yandex-cloud-ml-sdk/README.md at master · yandex-cloud/yandex-cloud-ml-sdk**
- URL: https://github.com/yandex-cloud/yandex-cloud-ml-sdk/blob/master/README.md
- from yandex_cloud_ml_sdk import YCloudML sdk = YCloudML(folder_id=&quot;...&quot;, auth=&quot;&lt;APIKey/IAMToken/SomethingElse&gt;&quot;) model = sdk.models.completions(&#x27;yandexgpt&#x27;) model = model.configure(temperature=0.5) result = model.run(&quot;foo&quot;) for alternative in result: print(alternative)
  > This Python library provides a simple and efficient software development kit (SDK) for interacting with Yandex Cloud Machine Learning services. The SDK abstracts away the complexities of raw gRPC calls, making it easier for developers to integrate cloud functionality into their applications seamlessly. Yandex Cloud ML SDK provides an easy-to-use interface for accessing Yandex Cloud ML services.
  > from yandex_cloud_ml_sdk import YCloudML sdk = YCloudML(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt') model = model.configure(temperature=0.5) result = model.run("foo") for alternative in result: print(alternative)
  > from yandex_cloud_ml_sdk import YCloudML from langchain_core.messages import AIMessage, HumanMessage sdk = YCloudML(folder_id="...", auth="<APIKey/IAMToken/SomethingElse>") model = sdk.models.completions('yandexgpt').langchain() langchain_result = model.invoke([ HumanMessage(content="hello!"), AIMessage(content="Hi there human!"), HumanMessage(content="Meow!"), ])

**7. GitHub - allseeteam/yandexgpt-python: Python SDK for YaGPT API · GitHub**
- URL: https://github.com/allseeteam/yandexgpt-python
- from yandex_gpt import YandexGPT, YandexGPTConfigManagerForAPIKey # Setup configuration (input fields may be empty if they are set in environment variables) config = YandexGPTConfigManagerForAPIKey(model_type=&quot;yandexgpt&quot;, catalog_id=&quot;your_catalog_id&quot;, api_key=&quot;your_api_key&quot;) # Instantiate YandexGPT yandex_gpt = YandexGPT(config_manager=config) # Async function to get 
  > The YandexGPT SDK is designed for asynchronous operation. To use it, instantiate the YandexGPT class with a configuration manager that includes your Yandex Cloud catalog ID, API key/IAM token, and the desired GPT model type.
  > The YandexGPT Python SDK provides an easy-to-use interface for interacting with the Yandex GPT API. It includes asynchronous methods for sending requests to the Yandex GPT API, handling authentication, and processing responses.
  > Asynchronous API calls to Yandex GPT. Easy configuration of API credentials and model parameters. Supports multiple GPT models. Includes utility for managing API request headers and payload. The SDK depends on several Python libraries for its operation. These dependencies are specified in the requirements.txt file. For more detailed information, including installation guides, usage examples, and API references, please visit the YandexGPT Python SDK Documentation.
  > from yandex_gpt import YandexGPT, YandexGPTConfigManagerForAPIKey # Setup configuration (input fields may be empty if they are set in environment variables) config = YandexGPTConfigManagerForAPIKey(model_type="yandexgpt", catalog_id="your_catalog_id", api_key="your_api_key") # Instantiate YandexGPT yandex_gpt = YandexGPT(config_manager=config) # Async function to get completion async def get_completion(): messages = [{"role": "user", "text": "Hello, world!"}] completion = await yandex_gpt.get_as

**8. YandexGPT - YandexGPT Python 0.2.3 documentation**
- URL: https://yandexgpt-python.readthedocs.io/en/latest/YandexGPT.html
- Synchronously sends a completion request to the Yandex GPT API and returns the completion result. async get_async_completion(messages: List[YandexGPTMessage] | List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1000, stream: bool = False, completion_url: str = &#x27;https://llm.api.cloud.yandex.net/foundationModels/v1/completionAsync&#x27;, timeout: int = 5) → str#
  > Extends the YandexGPTBase class to interact with the Yandex GPT API using a simplified configuration manager. This class allows for easier configuration of API requests and includes both synchronous and asynchronous methods. get_async_completion(messages, temperature, max_tokens, stream, completion_url, timeout) -> str
  > Asynchronously sends a completion request to the Yandex GPT API and returns the completion result. get_sync_completion(messages, temperature, max_tokens, stream, completion_url) -> str
  > Synchronously sends a completion request to the Yandex GPT API and returns the completion result. async get_async_completion(messages: List[YandexGPTMessage] | List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1000, stream: bool = False, completion_url: str = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completionAsync', timeout: int = 5) → str#
  > URL to the Yandex GPT asynchronous completion API. ... Time in seconds after which the operation is considered timed out. ... The text of the completion result. ... If the completion operation fails or times out. get_sync_completion(messages: List[YandexGPTMessage] | List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1000, stream: bool = False, completion_url: str = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion')#

**9. Quickstart Guide - YandexGPT Python 0.2.3 documentation**
- URL: https://yandexgpt-python.readthedocs.io/en/latest/quickstart.html
- from yandex_gpt import YandexGPT # Initialize YandexGPT with a configuration manager yandex_gpt = YandexGPT(config_manager=config_manager) # Synchronous completion example completion = yandex_gpt.get_sync_completion(messages=[{&#x27;role&#x27;: &#x27;user&#x27;, &#x27;text&#x27;: &#x27;Hello!&#x27;}]) print(completion) ... from ...
  > YandexGPT Class: The YandexGPT class is the main interface to the Yandex GPT API. It provides methods to send both synchronous and asynchronous requests for text completions. Configuration Managers: Configuration managers are used to set up and manage the necessary settings for the YandexGPT class, such as authentication and model details. For more information, see the Configuration Managers Module. Threads: The SDK offers the YandexGPTThread class to manage conversation threads, allowing for ma
  > from yandex_gpt import YandexGPT # Initialize YandexGPT with a configuration manager yandex_gpt = YandexGPT(config_manager=config_manager) # Synchronous completion example completion = yandex_gpt.get_sync_completion(messages=[{'role': 'user', 'text': 'Hello!'}]) print(completion) ... from yandex_gpt import YandexGPTThread # Create a thread instance using the same configuration manager thread = YandexGPTThread(config_manager=config_manager) # Add a message to the thread and run it asynchronously 
  > from yandex_gpt import YandexGPTConfigManagerForAPIKey # Initialize the configuration manager with model type, catalog ID, and API key config_manager = YandexGPTConfigManagerForAPIKey( model_type="yandexgpt", catalog_id="your_catalog_id", api_key="your_api_key" )

**10. YandexGPT Python SDK**
- URL: https://pypi.org/project/yandexgpt-python/
- The YandexGPT SDK is designed for asynchronous operation. To use it, instantiate the YandexGPT class with a configuration manager that includes your Yandex Cloud catalog ID, API key/IAM token, and the desired GPT model type.
  > The YandexGPT SDK is designed for asynchronous operation. To use it, instantiate the YandexGPT class with a configuration manager that includes your Yandex Cloud catalog ID, API key/IAM token, and the desired GPT model type.
  > The YandexGPT Python SDK provides an easy-to-use interface for interacting with the Yandex GPT API. It includes asynchronous methods for sending requests to the Yandex GPT API, handling authentication, and processing responses.
  > Asynchronous API calls to Yandex GPT. Easy configuration of API credentials and model parameters. Supports multiple GPT models. Includes utility for managing API request headers and payload. The SDK depends on several Python libraries for its operation. These dependencies are specified in the requirements.txt file. For more detailed information, including installation guides, usage examples, and API references, please visit the YandexGPT Python SDK Documentation.
  > If you want to install the SDK locally (for example, if you want to modify SDK code), you can do so by cloning the repository and running the setup script: git clone https://github.com/allseeteam/yandexgpt-python.git cd yandexgpt-python pip install -e .

### 🎥 Videos (3)

**Deep-dive для разработчиков: создание ...**
- URL: https://www.youtube.com/watch?v=Xjutc_T0p8s
- Duration: 01:18:29
- Creator: Yandex Cloud

**Создание AI-ассистентов - YouTube**
- URL: https://www.youtube.com/watch?v=kKbMaWSi20I
- Duration: 49:59
- Creator: Yandex Cloud

**Как создавать AI‑ассистентов - YouTube**
- URL: https://www.youtube.com/watch?v=TD1JY24QTAk
- Duration: 27:50
- Creator: Yandex Cloud


## q07 — "similarweb ai.pixeltools.ru OR rush-analytics.ru traffic 2026"

**Meta:** original='similarweb ai.pixeltools.ru OR rush-analytics.ru traffic 2026'

### 🔎 Web (1 results)

**1. rush-analytics.ru Website Traffic, Ranking, Analytics [October 2025]**
- URL: https://www.semrush.com/website/rush-analytics.ru/overview/
- rush-analytics.ru is ranked #21304 in RU with 140.1K Traffic. Categories: Advertising and Marketing, Online Services. Learn more about website traffic, market share, and more!
- Age: November 12, 2025


## site — "gitverse.ru stars trending developer tools 2026"

**Meta:** original='github.com russian "Alice AI" OR алиса SEO audit skill'

### 🔎 Web (10 results)

**1. alice-skills · GitHub Topics · GitHub**
- URL: https://github.com/topics/alice-skills
- yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk ... Оливер — навык для голосового помощника Алиса.
  > yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk ... Оливер — навык для голосового помощника Алиса.
  > Add a description, image, and links to the alice-skills topic page so that developers can more easily learn about it.
  > python bot framework yandex alice asyncio yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk yandex-lyceum aliceio
  > php sdk yandex alice alisa yandex-dialogs alice-skills alice-sdk yandex-alisa

**2. Alice AI - Wikipedia**
- URL: https://en.wikipedia.org/wiki/Alice_AI
- Alice&#x27;s voice is based on that of the Russian voice actress Tatyana Shitova. Voice requests to Alice AI are processed by Yandex cloud servers to retain some of them with the aim of expanding Alisa&#x27;s training set data. According to Denis Filippov, head of Yandex Speech Technologies, the retained voice data are completely anonymous and without any association with users&#x27; accounts. Ski
- Age: March 13, 2026
  > Alice's voice is based on that of the Russian voice actress Tatyana Shitova. Voice requests to Alice AI are processed by Yandex cloud servers to retain some of them with the aim of expanding Alisa's training set data. According to Denis Filippov, head of Yandex Speech Technologies, the retained voice data are completely anonymous and without any association with users' accounts. Skill constructors can be used to create skills for Alice.
  > It was decided that the voice assistant would be a young, ironic girl, ready to help the owner of a smartphone. The voice of "Alice" was dubbing actress Tatiana Shitova, who voiced most of Scarlett Johansson's characters and the voice of OS1, who called herself "Samantha", in the Russian dubbing of Spike Jonze's "Her".
  > Initially, the Alice AI neural network was trained on an array of texts from the classics of Russian literature, including works by Leo Tolstoy, Fyodor Dostoevsky, and Nikolai Gogol, and then on arrays of live texts from the Internet. As Mikhail Bilenko, the head of Yandex Machine Learning, told Meduza in an interview, during the early tests impertinence appeared in Alice's communication style, which surprised and amused users.
  > In 2018, the company expanded the capabilities of Alice through a system of "skills" that use the voice assistant platform to interact with the user. "Skills" are chatbots and other Internet services that are activated by a key phrase and work in the interface of Alice.

**3. yandex-alice · GitHub Topics · GitHub**
- URL: https://github.com/topics/yandex-alice?o=desc&s=forks/1000
- An educational bot dedicated to learning Russian literature (direct link: https://dialogs.yandex.ru/store/skills/90d1d068-viktorina-literaturnyj-genij) python api bot json yandex educational-game educational-project yandex-alice ... Пример навыка голосового помощника Алиса на яндекс функциях.
  > An educational bot dedicated to learning Russian literature (direct link: https://dialogs.yandex.ru/store/skills/90d1d068-viktorina-literaturnyj-genij) python api bot json yandex educational-game educational-project yandex-alice ... Пример навыка голосового помощника Алиса на яндекс функциях.
  > Alice is a Go package providing helpers for developing skills for Alice virtual assistant via Yandex.Dialogs platform. alice hacktoberfest yandex-dialogs yandex-alice alice-sdk yandex-dialogs-sdk ... Навык для голосового помощника от Яндекс "Алиса", который позволяет выполнять несколько сценариев умного дома за одну команду, а так же выполнять сценарии по таймеру.
  > An example of Yandex Alice skill with a back-end deployed to the AWS.
  > yandex alice proxmox yandex-dialogs yandex-alice alice-skills proxmox-api

**4. Build software better, together**
- URL: https://github.com/topics/alisa
- chat bot yandex bots chatbot dialog alice alisa yandex-dialogs ... 🎙️ Библиотека для разработки навыков голосового помощника Алиса. ... 📹 Share knowledge and grow with SkillBridge, an open-source platform for video tutorials that connects instructors and eager learners. react machine-learning ai wallet alexa-skill h5p amazon-alexa hacktoberfest mqtt-protocol amazon-lambda upskill alisa alexa-smart
  > chat bot yandex bots chatbot dialog alice alisa yandex-dialogs ... 🎙️ Библиотека для разработки навыков голосового помощника Алиса. ... 📹 Share knowledge and grow with SkillBridge, an open-source platform for video tutorials that connects instructors and eager learners. react machine-learning ai wallet alexa-skill h5p amazon-alexa hacktoberfest mqtt-protocol amazon-lambda upskill alisa alexa-smart yandex-alice reskilling alisa-skills hacktoberfest2025 tutorial-platform
  > php sdk yandex alice alisa yandex-dialogs alice-skills alice-sdk yandex-alisa
  > productivity todo yandex skill todoist alice todoist-api alisa todoist-tasks yandex-alice alice-skills yandex-alisa todoist-rest
  > telegram-bot vk-bot viber-bot alisa vui marusia-skills marusia alisa-skills

**5. Alice: AI assistant - App Store - Apple**
- URL: https://apps.apple.com/us/app/alice-ai-assistant/id6621272550
- Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity.
  > She has high emotional intelligence and skillful speech recognition for beginners at learning the Russian language. If you prefer to type and to read in English, she can interact with you just as well. After several months, I am still finding Alice to be helpful and enjoyable to chat with. If anything, the new version has only brought improvements. Thank you to the Yandex team for the hard work that they put into their products! ... Приятно знать, что Алиса вам помогает.
  > She has high emotional intelligence and skillful speech recognition for beginners at learning the Russian language. If you prefer to type and to read in English, she can interact with you just as well. After several months, I am still finding Alice to be helpful and enjoyable to chat with. If anything, the new version has only brought improvements. Thank you to the Yandex team for the hard work that they put into their products! Developer Response 08/31/2025 Приятно знать, что Алиса вам помогает
  > Алиса AI поможет превратить любое изображение в видеоролик, которым захочется поделиться.
  > Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity. Explore what the neural network can do with Alice—everything you expect from a smart chat in Russian.

**6. GitHub - sameoldmadness/awesome-alice: Библиотеки и ресурсы для Яндекс.Диалогов**
- URL: https://github.com/sameoldmadness/awesome-alice
- yandex/alice-skills - Примеры от Яндекса · jeyroik/php-yandex-alisa-simple - Пример на PHP · seralexeev/alice-dotnet - Пример на С# и .NET Core · sameoldmadness/alice-ts - Пример на TypeScript · surik00/aioAlice - Примеры на Python + aioAlice
  > granstel/Templates.Chatbot - Шаблонный проект на C# (Алиса, Telegram, Chat2Desk) popstas/yandex-dialogs-whatis - Пример на yandex-dialogs-sdk, навык Вторая память · ShoshinNikita/radio-t-bot - Пример на Go, навык Радио-Т · let-robots-reign/RussianHistory_Quiz - Пример на Python, навык Викторина по истории России
  > subnetsRU/alice-command-skill - Навык позволяет выполнять несколько сценариев умного дома · Школа Алисы - официальный канал на YouTube · Новая платформа уже здесь / Владимир Гриненко - WSD в Петербурге 2019 · Алиса, пойдём во фронтенд!
  > yandex/alice-skills - Примеры от Яндекса · jeyroik/php-yandex-alisa-simple - Пример на PHP · seralexeev/alice-dotnet - Пример на С# и .NET Core · sameoldmadness/alice-ts - Пример на TypeScript · surik00/aioAlice - Примеры на Python + aioAlice
  > Связка аккаунтов Алиса и Яндекс.Паспорт (OAuth2) - инструкция как сделать связку аккаунтов для Алисы без своего OAuth2-сервера

**7. Alice AI - Apps on Google Play**
- URL: https://play.google.com/store/apps/details?id=com.yandex.aliceapp&hl=en
- Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity.
  > AI chat for real-life tasks

**8. “Alice, what’s new?” — Yandex introduces Alice AI**
- URL: https://yandex.com/company/news/2025-10-28-01
- At the “Alice, what’s new?” conference today, Yandex introduced Alice AI — a powerful, universal neural network that can help users solve almost any task in chat. Its usefulness and capabilities, compared to other AI products available in Russia, have been tested on thousands of real ...
- Age: October 28, 2025
  > At the “Alice, what’s new?” conference today, Yandex introduced Alice AI — a powerful, universal neural network that can help users solve almost any task in chat. Its usefulness and capabilities, compared to other AI products available in Russia, have been tested on thousands of real use cases.
  > It excels at practical tasks and outperforms all other neural networks available in Russia in answering questions in the categories of Education, Personal Growth & Advice, Professional Tasks, and Household Tasks & How-tos, covering the main AI needs that exist now or are likely to appear soon for Russian-speaking users.

**9. Yandex with Alice AI - App Store - Apple**
- URL: https://apps.apple.com/us/app/yandex-with-alice-ai/id1050704155
- It’s ok. It does collect a lot of personal data. A lot of what’s collected seems to have no use in the big picture. I guess they are collecting data for reasons other than just making money. Final comment. The reviews here, North America or USA store have more reviews written in Russian.
  > I am a native speaker of English learning Russian on my own. Yandex provides many avenues to do this, and because I spend a lot of time on the phone (unfortunately, and who doesn't right?) this is a great tool to immerse yourself in Russian.
  > It’s ok. It does collect a lot of personal data. A lot of what’s collected seems to have no use in the big picture. I guess they are collecting data for reasons other than just making money. Final comment. The reviews here, North America or USA store have more reviews written in Russian.
  > Dear yandex,Yandex app in ios has only russian verson. There's no english, so it's hard for many people who are fans of Yandex but didn't understand for russian alphabets. Please, please, please make it also english verson.

**10. datanymizer/datanymizer_engine/src/locale/ru.rs at main · datanymizer/datanymizer**
- URL: https://github.com/datanymizer/datanymizer/blob/main/datanymizer_engine/src/locale/ru.rs
- &quot;Александра&quot;, &quot;Алина&quot;, &quot;Алиса&quot;, &quot;Алла&quot;, &quot;Альберта&quot;, &quot;Альбертина&quot;, &quot;Альбина&quot;, &quot;Альфреда&quot;,
  > Powerful database anonymizer with flexible rules. Written in Rust. - datanymizer/datanymizer_engine/src/locale/ru.rs at main · datanymizer/datanymizer
  > "Александра", "Алина", "Алиса", "Алла", "Альберта", "Альбертина", "Альбина", "Альфреда",

### 📦 Infobox

**Alice AI** (infobox)
Russian intelligent personal assistant software
_Alice AI (formerly Alice and Alice Neural Network) is a Russian generative artificial intelligence chatbot and intelligent personal assistant for Android, iOS and Windows operating systems and Yandex's own devices developed by Yandex. Alice was officially introduced on 10 October 2017._
- Developer: <a href='https://en.wikipedia.org/wiki/Yandex'>Yandex</a>
- Initial release: October 10, 2017; 8 years ago (2017-10-10)
- Written in: <a href='https://en.wikipedia.org/wiki/C%2B%2B'>C++</a>
- Engine: <a href='https://en.wikipedia.org/wiki/Alice_AI_(AI_model_family)'>Alice AI 1.0</a>
- Operating system: <a href='https://en.wikipedia.org/wiki/Windows'>Windows</a>, <a href='https://en.wikipedia.org/wiki/IOS'>iOS</a>, <a href='https://en.wikipedia.org/wiki/Android_(operating_system)'>Android</a>
- Available in: <a href='https://en.wikipedia.org/wiki/Russian_language'>Russian</a>
- Type: <a href='https://en.wikipedia.org/wiki/Chatbot'>Chatbot</a><br><a href='https://en.wikipedia.org/wiki/Large_language_model'>Large language model</a><br><a href='https://en.wikipedia.org/wiki/Generative_pre-trained_transformer'>Generative pre-trained transformer</a><br><a href='https://en.wikipedia.org/wiki/Intelligent_personal_assistant'>Intelligent personal assistant</a>
- License: <a href='https://en.wikipedia.org/wiki/Proprietary_software'>Proprietary</a>


## q08 — "gitverse.ru repositories ranking discovery popular"

**Meta:** original='gitverse.ru repositories ranking discovery popular'

### 🔎 Web (10 results)

**1. Gitstar Ranking - Top GitHub users and repositories**
- URL: https://gitstar-ranking.com/
- Gitstar Ranking is a GitHub star ranking. You can see top 10,000 users, organizations and repositories. Find your favorite user. See what is your rank.

**2. Trending repositories on GitHub today · GitHub**
- URL: https://github.com/trending
- π RuView: WiFi DensePose turns commodity WiFi signals into real-time human pose estimation, vital sign monitoring, and presence detection — all without a single pixel of video. ... OpenMetadata is a unified metadata platform for data discovery, data observability, and data governance powered by a central metadata repository, in-depth column level lineage, and seamless team collaboration.
- Age: 3 weeks ago
  > π RuView: WiFi DensePose turns commodity WiFi signals into real-time human pose estimation, vital sign monitoring, and presence detection — all without a single pixel of video. ... OpenMetadata is a unified metadata platform for data discovery, data observability, and data governance powered by a central metadata repository, in-depth column level lineage, and seamless team collaboration.
  > Oromo Oriya Ossetian, Ossetic Punjabi, Panjabi Pali Persian Polish Pashto, Pushto Portuguese Quechua Romansh Rundi Romanian, Moldavian, Moldovan Russian Sanskrit Sardinian Sindhi Northern Sami Samoan Sango Serbian Gaelic, Scottish Gaelic Shona Sinhala, Sinhalese Slovak Slovenian Somali Southern Sotho Spanish, Castilian Sundanese Swahili Swati Swedish Tamil Telugu Tajik Thai Tigrinya Tibetan Turkmen Tagalog Tswana Tonga (Tonga Islands) Turkish Tsonga Tatar Twi Tahitian Uighur, Uyghur Ukrainian Ur
  > Unknown languages 1C Enterprise 2-Dimensional Array 4D ABAP ABAP CDS ABNF ActionScript Ada Adblock Filter List Adobe Font Metrics Agda AGS Script AIDL Aiken AL ALGOL Alloy Alpine Abuild Altium Designer AMPL AngelScript Answer Set Programming Ant Build System Antlers ANTLR ApacheConf Apex API Blueprint APL Apollo Guidance Computer AppleScript Arc AsciiDoc ASL ASN.1 Classic ASP ASP.NET AspectJ Assembly Astro Asymptote ATS Augeas AutoHotkey AutoIt Avro IDL Awk B (Formal Method) B4X Ballerina BASIC 

**3. GitHub - EvanLi/Github-Ranking: :star:Github Ranking:star: Github stars and forks ranking list. Github Top100 stars list of different langua**
- URL: https://github.com/EvanLi/Github-Ranking
- :star:Github Ranking:star: Github stars and forks ranking list. Github Top100 stars list of different languages. Automatically update daily. | Github仓库排名，每日自动更新 - EvanLi/Github-Ranking
- Age: 3 weeks ago
  > Share, discover, and collect prompts from the community. Free and open source — self-host for your organization with complete privacy. ... Java 面试 & 后端通用面试指南，覆盖计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发 ... 《Hello 算法》：动画图解、一键运行的数据结构与算法教程。支持简中、繁中、English、日本語，提供 Python, Java, C++, C, C#, JS, Go, Swift, Rust, Ruby, Kotlin, TS, Dart 等代码实现
  > File Upload widget with multiple file selection, drag&drop support, progress bar, validation and preview images, audio and video for jQuery. Supports cross-domain, chunked and resumable file uploads. Works with any server-side platform (Google App Engine, PHP, Python, Ruby on Rails, Java, etc.) that supports standard HTML form file uploads.
  > The repo is finally unlocked. enjoy the party! The fastest repo in history to surpass 100K stars ⭐. Join Discord: https://discord.gg/5TUQKqFWd Built in Rust using oh-my-codex.
  > GPT4All: Run Local LLMs on Any Device.

**4. Repositories Ranking - Gitstar Ranking**
- URL: https://gitstar-ranking.com/repositories
- See the top 10,000 GitHub repositories on GitHub Ranking.
  > Shell 52. rust-lang/rust rust 112012
  > A modern runtime for JavaScript and TypeScript.
  > Set up a modern web app by running one command.
  > Python 88. ruanyf/weekly weekly 87791

**5. GitHub - GitVerse-HQ/gitverse · GitHub**
- URL: https://github.com/GitVerse-HQ/gitverse
- Gitverse supports open-source projects to mint programmable NFTs to realize project copyright tracking, value accumulation, and developer ecological incentives.
  > Gitverse supports open-source projects to mint programmable NFTs to realize project copyright tracking, value accumulation, and developer ecological incentives.
  > Currently, all codes are uploaded to the gitverse code warehouse based on the commitId point, and later optimized to only upload the code that is different from the previous commitId.
  > gitverse init Create a gitverse code warehouse in the current directory, and create a smart contract based on the repository name;
  > gitverse add <pathlist...> Add the specified file or directory to the gitverse code staging area

**6. | GitVerse**
- URL: https://gitverse.ru/docs/collaborative/repositories/guides/repository-workflow/
- 21. GET /orgs/{org}/actions/runners — получить список раннеров для организации
  > 21. GET /orgs/{org}/actions/runners — получить список раннеров для организации
  > 22. POST /orgs/{org}/actions/runners/registration-token — создать токен регистрации раннера для организации
  > 23. GET /orgs/{org}/actions/runners/{runner_id} — получить информацию о раннере для организации
  > 24. DELETE /orgs/{org}/actions/runners/{runner_id} — удалить раннер из организации

**7. 🌟 200+ Ultimate Open-Source Repositories: The Developer’s Curated Guide [2026] — 🚀 (Curated by Category) | top-github-repos-list**
- URL: https://md8-habibullah.github.io/top-github-repos-list/
- best-of-lists — Discover awesome open-source projects, ranked by quality and updated weekly.
  > Cai-Framework — Cybersecurity AI framework for building autonomous agents that discover and exploit vulnerabilities. Honeymap — Real-time visualization of world-wide honeypot attacks (see the “botnet” in action). Bettercap — The “Swiss Army Knife” for 802.11, BLE, and Ethernet reconnaissance and MITM attacks. RustScan — A modern port scanner that can scan 65k ports in 3 seconds; designed for speed and scriptability.
  > best-of-lists — Discover awesome open-source projects, ranked by quality and updated weekly.
  > Ollama — Run large language models (Llama 3.2, Mistral) locally.
  > Conduit — Lightweight Matrix homeserver written in Rust.

**8. GitHub - sachin-source/top-github-repositories-which-everyone-should-look: This repository contains a list of important and useful github re**
- URL: https://github.com/sachin-source/top-github-repositories-which-everyone-should-look
- This repository contains a list of important and useful github repos which a developer, coder, a student should never miss to look at. - sachin-source/top-github-repositories-which-everyone-should-look
  > This repository contains a list of important and useful github repos which a developer, coder, a student should never miss to look at. - sachin-source/top-github-repositories-which-everyone-should-look

**9. 15 Most Popular GitHub Repos for Developers in 2026**
- URL: https://www.hostinger.com/tutorials/most-popular-github-repos
- As the most popular Git repository hosting platform, GitHub hosts more than 300 million repositories with a global community of over 100 million developers. The platform has become one of the best sources for free and useful software and web development resources. However, with so many projects available, finding the best git repository for your needs can be a daunting task. This is why we have co
- Age: April 26, 2025
  > The following are some of the most starred repositories offering valuable learning materials for aspiring and professional developers. ... freeCodeCamp is the most starred repository on GitHub. It is the backend for the main freeCodeCamp website that offers numerous free computer science learning materials. These include over 9,000 tutorials and 11 core certifications, ranging from responsive web design to machine learning with Python. freeCodeCamp is a charitable organization that runs on donor
  > As the most popular Git repository hosting platform, GitHub hosts more than 300 million repositories with a global community of over 100 million developers. The platform has become one of the best sources for free and useful software and web development resources. However, with so many projects available, finding the best git repository for your needs can be a daunting task. This is why we have compiled 15 of the most popular GitHub repos, ranked from the most starred to the least.
  > Run by the Free Ebook Foundation, this popular repository has become one of the top GitHub projects.
  > Paperclip is an open-source platform for running fully autonomous business operations using AI agents.

**10. Leino | GitVerse Project — Self-Hosted Git Repository Management System**
- URL: https://leino.dev/en/cases/gitverse/
- The platform was intended to serve as a Russian alternative to GitLab and GitHub, meeting local regulatory requirements, providing a user-friendly interface for collaborative development, and supporting CI/CD tools, DevOps integrations, and access management. We created a web application with a Git repository management panel that enables users to create, clone, and manage repositories, as well as
- Age: August 6, 2025
  > Our task was to develop a modern, secure, and scalable code repository management system for deployment on companies’ own servers. The platform was intended to serve as a Russian alternative to GitLab and GitHub, meeting local regulatory requirements, providing a user-friendly interface for collaborative development, and supporting CI/CD tools, DevOps integrations, and access management.
  > GitVerse provides a convenient interface for collaborative code work, including pull requests, reviews, tasks, and wikis. It is secure, compliant with local regulations, and can be deployed in isolated networks. The flexible architecture scales to support teams of any size, from small startups to large enterprises.
  > The platform was intended to serve as a Russian alternative to GitLab and GitHub, meeting local regulatory requirements, providing a user-friendly interface for collaborative development, and supporting CI/CD tools, DevOps integrations, and access management. We created a web application with a Git repository management panel that enables users to create, clone, and manage repositories, as well as work with branches, pull requests, code reviews, tasks, and wikis.

### 💬 Discussions (12)

**1. how to check popular repos and other stats in github? - Stack Overflow**
- URL: https://stackoverflow.com/questions/23170132/how-to-check-popular-repos-and-other-stats-in-github
- I 'm not able to find the way of finding out which repos have most stars , most forked and according to each language. There is no direct link to statistics and when I go to stars , it only shows my

**2. How to find out "The most popular repositories" on Github? - Stack Overflow**
- URL: https://stackoverflow.com/questions/19855552/how-to-find-out-the-most-popular-repositories-on-github
- Once upon a time, we can watch the most popular repositories (Most forked or Most watched) at this page (https://github.com/popular/watched) of Github. like this: But now when you try to explore re...

**3. The most starred GitHub repos are learning resources**
- URL: https://www.reddit.com/r/learnprogramming/comments/1gdezx8/the_most_starred_github_repos_are_learning/
- That is interesting. I would have not thought that at first but it makes sense. Most software projects out there are designed to fill a niche of some industry and is not going to have the full breadth of eyes on it. However, learning resources can service devs from all areas of development working o

**4. Best Github repositories?**
- URL: https://www.reddit.com/r/AskComputerScience/comments/1fzm1kq/best_github_repositories/
- Just do GitHub Advanced Search, https://github.com/search/advanced , do "With this many stars" > 20000 , and scroll through all the repos. Or filter it by a programming language and do the same thing.

**5. Interesting GitHub Repositories**
- URL: https://www.reddit.com/r/DataHoarder/comments/1cr14sg/interesting_github_repositories/
- Check out the various awesome lists on GitHub, here is one of several overviews , they are lists of cool projects on GitHub by topic.

### 🎥 Videos (6)

**GitVerse Российская платформа для работы ...**
- URL: https://www.youtube.com/watch?v=CPh92l4NLQ8
- Duration: 08:32
- Creator: ITDoctor

**Убийца GitHub? GitVerse Российская платформа.**
- URL: https://www.youtube.com/watch?v=ZIATvD9oo6o
- Duration: 15:33
- Creator: Cделано на Unreal Engine

**Как работать с Git LFS (+ бонус: GitVerse 19.0.0) ...**
- URL: https://www.youtube.com/watch?v=jwrLHHvFi0E

**GitVerse — пространство для развития, ...**
- URL: https://www.youtube.com/watch?v=jo7bcJC10tM
- Duration: 40:17
- Creator: NSS Lab ITMO

**GitVerse: открой вселенную кода - YouTube**
- URL: https://www.youtube.com/watch?v=txpzUUIVkd8
- Duration: 04:04:21
- Creator: Habr


## q09 — ""LLM Spot" Digital Geeks brand visibility platform публичная"

**Meta:** original='"LLM Spot" Digital Geeks brand visibility platform публичная'


## q10 — "Envybox Ковалевы "открытое GEO" 2026 что это"

**Meta:** original='envybox Ковалевы "открытое geo" 2026 что это'

### 🔎 Web (1 results)

**1. Envybox и агентство «Ковалевы» запускают открытое GEO-продвижение - Новости Интернет-маркетинга**
- URL: https://news.inhouse-marketing.ru/2026/04/22/envybox-i-agentstvo-kovalevy-zapyskaut-otkrytoe-geo-prodvijenie/
- Именно эту задачу мы и берем в работу в рамках открытого GEO-эксперимента совместно с Envybox.
- Age: 2 days ago
  > Поведение пользователей в поисковых системах меняется. Все чаще ответы ищут не только в Яндексе и Google, но и напрямую задают вопросы в ChatGPT, Perplexity AI, Google Gemini и других нейросетях.
  > 22.04.2026 · Envybox и агентство «Ковалевы» запускают открытое GEO-продвижение · 22.04.2026 · «Видимость сайта в Алисе AI»: новый инструмент в Яндекс Вебмастере ·
  > Именно эту задачу мы и берем в работу в рамках открытого GEO-эксперимента совместно с Envybox.
  > Если классическое SEO работает с выдачей ссылок, то GEO – с источниками, на которые опираются AI-модели. В этом случае цель – сделать так, чтобы бренд: упоминался в ответах нейросетей, ... По сути, речь идет о новом уровне конкуренции: не за позицию в топ-10, а за место внутри самого ответа. Envybox – IT-компания, разрабатывающая инструменты для роста конверсии и автоматизации бизнеса.


## site — "github.com russian "Alice AI" OR алиса SEO audit skill"

**Meta:** original='github.com russian "Alice AI" OR алиса SEO audit skill'

### 🔎 Web (10 results)

**1. alice-skills · GitHub Topics · GitHub**
- URL: https://github.com/topics/alice-skills
- yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk ... Оливер — навык для голосового помощника Алиса.
  > yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk ... Оливер — навык для голосового помощника Алиса.
  > Add a description, image, and links to the alice-skills topic page so that developers can more easily learn about it.
  > python bot framework yandex alice asyncio yandex-dialogs yandex-alice alice-skills yandex-dialogs-sdk yandex-lyceum aliceio
  > php sdk yandex alice alisa yandex-dialogs alice-skills alice-sdk yandex-alisa

**2. Alice AI - Wikipedia**
- URL: https://en.wikipedia.org/wiki/Alice_AI
- Alice&#x27;s voice is based on that of the Russian voice actress Tatyana Shitova. Voice requests to Alice AI are processed by Yandex cloud servers to retain some of them with the aim of expanding Alisa&#x27;s training set data. According to Denis Filippov, head of Yandex Speech Technologies, the retained voice data are completely anonymous and without any association with users&#x27; accounts. Ski
- Age: March 13, 2026
  > Alice's voice is based on that of the Russian voice actress Tatyana Shitova. Voice requests to Alice AI are processed by Yandex cloud servers to retain some of them with the aim of expanding Alisa's training set data. According to Denis Filippov, head of Yandex Speech Technologies, the retained voice data are completely anonymous and without any association with users' accounts. Skill constructors can be used to create skills for Alice.
  > It was decided that the voice assistant would be a young, ironic girl, ready to help the owner of a smartphone. The voice of "Alice" was dubbing actress Tatiana Shitova, who voiced most of Scarlett Johansson's characters and the voice of OS1, who called herself "Samantha", in the Russian dubbing of Spike Jonze's "Her".
  > Initially, the Alice AI neural network was trained on an array of texts from the classics of Russian literature, including works by Leo Tolstoy, Fyodor Dostoevsky, and Nikolai Gogol, and then on arrays of live texts from the Internet. As Mikhail Bilenko, the head of Yandex Machine Learning, told Meduza in an interview, during the early tests impertinence appeared in Alice's communication style, which surprised and amused users.
  > In 2018, the company expanded the capabilities of Alice through a system of "skills" that use the voice assistant platform to interact with the user. "Skills" are chatbots and other Internet services that are activated by a key phrase and work in the interface of Alice.

**3. yandex-alice · GitHub Topics · GitHub**
- URL: https://github.com/topics/yandex-alice?o=desc&s=forks/1000
- An educational bot dedicated to learning Russian literature (direct link: https://dialogs.yandex.ru/store/skills/90d1d068-viktorina-literaturnyj-genij) python api bot json yandex educational-game educational-project yandex-alice ... Пример навыка голосового помощника Алиса на яндекс функциях.
  > An educational bot dedicated to learning Russian literature (direct link: https://dialogs.yandex.ru/store/skills/90d1d068-viktorina-literaturnyj-genij) python api bot json yandex educational-game educational-project yandex-alice ... Пример навыка голосового помощника Алиса на яндекс функциях.
  > Alice is a Go package providing helpers for developing skills for Alice virtual assistant via Yandex.Dialogs platform. alice hacktoberfest yandex-dialogs yandex-alice alice-sdk yandex-dialogs-sdk ... Навык для голосового помощника от Яндекс "Алиса", который позволяет выполнять несколько сценариев умного дома за одну команду, а так же выполнять сценарии по таймеру.
  > An example of Yandex Alice skill with a back-end deployed to the AWS.
  > yandex alice proxmox yandex-dialogs yandex-alice alice-skills proxmox-api

**4. Build software better, together**
- URL: https://github.com/topics/alisa
- chat bot yandex bots chatbot dialog alice alisa yandex-dialogs ... 🎙️ Библиотека для разработки навыков голосового помощника Алиса. ... 📹 Share knowledge and grow with SkillBridge, an open-source platform for video tutorials that connects instructors and eager learners. react machine-learning ai wallet alexa-skill h5p amazon-alexa hacktoberfest mqtt-protocol amazon-lambda upskill alisa alexa-smart
  > chat bot yandex bots chatbot dialog alice alisa yandex-dialogs ... 🎙️ Библиотека для разработки навыков голосового помощника Алиса. ... 📹 Share knowledge and grow with SkillBridge, an open-source platform for video tutorials that connects instructors and eager learners. react machine-learning ai wallet alexa-skill h5p amazon-alexa hacktoberfest mqtt-protocol amazon-lambda upskill alisa alexa-smart yandex-alice reskilling alisa-skills hacktoberfest2025 tutorial-platform
  > php sdk yandex alice alisa yandex-dialogs alice-skills alice-sdk yandex-alisa
  > productivity todo yandex skill todoist alice todoist-api alisa todoist-tasks yandex-alice alice-skills yandex-alisa todoist-rest
  > telegram-bot vk-bot viber-bot alisa vui marusia-skills marusia alisa-skills

**5. Alice: AI assistant - App Store - Apple**
- URL: https://apps.apple.com/us/app/alice-ai-assistant/id6621272550
- Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity.
  > She has high emotional intelligence and skillful speech recognition for beginners at learning the Russian language. If you prefer to type and to read in English, she can interact with you just as well. After several months, I am still finding Alice to be helpful and enjoyable to chat with. If anything, the new version has only brought improvements. Thank you to the Yandex team for the hard work that they put into their products! ... Приятно знать, что Алиса вам помогает.
  > She has high emotional intelligence and skillful speech recognition for beginners at learning the Russian language. If you prefer to type and to read in English, she can interact with you just as well. After several months, I am still finding Alice to be helpful and enjoyable to chat with. If anything, the new version has only brought improvements. Thank you to the Yandex team for the hard work that they put into their products! Developer Response 08/31/2025 Приятно знать, что Алиса вам помогает
  > Алиса AI поможет превратить любое изображение в видеоролик, которым захочется поделиться.
  > Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity. Explore what the neural network can do with Alice—everything you expect from a smart chat in Russian.

**6. GitHub - sameoldmadness/awesome-alice: Библиотеки и ресурсы для Яндекс.Диалогов**
- URL: https://github.com/sameoldmadness/awesome-alice
- yandex/alice-skills - Примеры от Яндекса · jeyroik/php-yandex-alisa-simple - Пример на PHP · seralexeev/alice-dotnet - Пример на С# и .NET Core · sameoldmadness/alice-ts - Пример на TypeScript · surik00/aioAlice - Примеры на Python + aioAlice
  > granstel/Templates.Chatbot - Шаблонный проект на C# (Алиса, Telegram, Chat2Desk) popstas/yandex-dialogs-whatis - Пример на yandex-dialogs-sdk, навык Вторая память · ShoshinNikita/radio-t-bot - Пример на Go, навык Радио-Т · let-robots-reign/RussianHistory_Quiz - Пример на Python, навык Викторина по истории России
  > subnetsRU/alice-command-skill - Навык позволяет выполнять несколько сценариев умного дома · Школа Алисы - официальный канал на YouTube · Новая платформа уже здесь / Владимир Гриненко - WSD в Петербурге 2019 · Алиса, пойдём во фронтенд!
  > yandex/alice-skills - Примеры от Яндекса · jeyroik/php-yandex-alisa-simple - Пример на PHP · seralexeev/alice-dotnet - Пример на С# и .NET Core · sameoldmadness/alice-ts - Пример на TypeScript · surik00/aioAlice - Примеры на Python + aioAlice
  > Связка аккаунтов Алиса и Яндекс.Паспорт (OAuth2) - инструкция как сделать связку аккаунтов для Алисы без своего OAuth2-сервера

**7. Alice AI - Apps on Google Play**
- URL: https://play.google.com/store/apps/details?id=com.yandex.aliceapp&hl=en
- Alice AI: texts, neural network, fresh ideas, knowledge, Russian-language AI chat. Powerful Yandex AI on your phone helps with everyday chores and tackles tasks for study, work, and creativity.
  > AI chat for real-life tasks

**8. “Alice, what’s new?” — Yandex introduces Alice AI**
- URL: https://yandex.com/company/news/2025-10-28-01
- At the “Alice, what’s new?” conference today, Yandex introduced Alice AI — a powerful, universal neural network that can help users solve almost any task in chat. Its usefulness and capabilities, compared to other AI products available in Russia, have been tested on thousands of real ...
- Age: October 28, 2025
  > At the “Alice, what’s new?” conference today, Yandex introduced Alice AI — a powerful, universal neural network that can help users solve almost any task in chat. Its usefulness and capabilities, compared to other AI products available in Russia, have been tested on thousands of real use cases.
  > It excels at practical tasks and outperforms all other neural networks available in Russia in answering questions in the categories of Education, Personal Growth & Advice, Professional Tasks, and Household Tasks & How-tos, covering the main AI needs that exist now or are likely to appear soon for Russian-speaking users.

**9. Yandex with Alice AI - App Store - Apple**
- URL: https://apps.apple.com/us/app/yandex-with-alice-ai/id1050704155
- It’s ok. It does collect a lot of personal data. A lot of what’s collected seems to have no use in the big picture. I guess they are collecting data for reasons other than just making money. Final comment. The reviews here, North America or USA store have more reviews written in Russian.
  > I am a native speaker of English learning Russian on my own. Yandex provides many avenues to do this, and because I spend a lot of time on the phone (unfortunately, and who doesn't right?) this is a great tool to immerse yourself in Russian.
  > It’s ok. It does collect a lot of personal data. A lot of what’s collected seems to have no use in the big picture. I guess they are collecting data for reasons other than just making money. Final comment. The reviews here, North America or USA store have more reviews written in Russian.
  > Dear yandex,Yandex app in ios has only russian verson. There's no english, so it's hard for many people who are fans of Yandex but didn't understand for russian alphabets. Please, please, please make it also english verson.

**10. datanymizer/datanymizer_engine/src/locale/ru.rs at main · datanymizer/datanymizer**
- URL: https://github.com/datanymizer/datanymizer/blob/main/datanymizer_engine/src/locale/ru.rs
- &quot;Александра&quot;, &quot;Алина&quot;, &quot;Алиса&quot;, &quot;Алла&quot;, &quot;Альберта&quot;, &quot;Альбертина&quot;, &quot;Альбина&quot;, &quot;Альфреда&quot;,
  > Powerful database anonymizer with flexible rules. Written in Rust. - datanymizer/datanymizer_engine/src/locale/ru.rs at main · datanymizer/datanymizer
  > "Александра", "Алина", "Алиса", "Алла", "Альберта", "Альбертина", "Альбина", "Альфреда",

### 📦 Infobox

**Alice AI** (infobox)
Russian intelligent personal assistant software
_Alice AI (formerly Alice and Alice Neural Network) is a Russian generative artificial intelligence chatbot and intelligent personal assistant for Android, iOS and Windows operating systems and Yandex's own devices developed by Yandex. Alice was officially introduced on 10 October 2017._
- Developer: <a href='https://en.wikipedia.org/wiki/Yandex'>Yandex</a>
- Initial release: October 10, 2017; 8 years ago (2017-10-10)
- Written in: <a href='https://en.wikipedia.org/wiki/C%2B%2B'>C++</a>
- Engine: <a href='https://en.wikipedia.org/wiki/Alice_AI_(AI_model_family)'>Alice AI 1.0</a>
- Operating system: <a href='https://en.wikipedia.org/wiki/Windows'>Windows</a>, <a href='https://en.wikipedia.org/wiki/IOS'>iOS</a>, <a href='https://en.wikipedia.org/wiki/Android_(operating_system)'>Android</a>
- Available in: <a href='https://en.wikipedia.org/wiki/Russian_language'>Russian</a>
- Type: <a href='https://en.wikipedia.org/wiki/Chatbot'>Chatbot</a><br><a href='https://en.wikipedia.org/wiki/Large_language_model'>Large language model</a><br><a href='https://en.wikipedia.org/wiki/Generative_pre-trained_transformer'>Generative pre-trained transformer</a><br><a href='https://en.wikipedia.org/wiki/Intelligent_personal_assistant'>Intelligent personal assistant</a>
- License: <a href='https://en.wikipedia.org/wiki/Proprietary_software'>Proprietary</a>

---

## Sweep summary

- Total queries: 12
- Web: 12 ok / 0 failed
- Silent warnings: 2
- Duration: 12.0s
- Unique hostnames: 40

## Top hostnames

| Domain | Appearances |
|--------|-------------|
| github.com | 23 |
| pypi.org | 6 |
| yandex.cloud | 6 |
| fichi.ai | 3 |
| natasha.github.io | 2 |
| arxiv.org | 2 |
| huggingface.co | 2 |
| mysummit.school | 2 |
| yandex.com | 2 |
| yandexgpt-python.readthedocs.io | 2 |
| apps.apple.com | 2 |
| gitstar-ranking.com | 2 |
| vc.ru | 1 |
| aclanthology.org | 1 |
| docs.deeppavlov.ai | 1 |
| link.springer.com | 1 |
| stackoverflow.com | 1 |
| campus.datacamp.com | 1 |
| seantrott.substack.com | 1 |
| py-readability-metrics.readthedocs.io | 1 |


---
_Data retrieved via Brave Search API. **POWERED BY BRAVE.**_  
_For internal research only; not for redistribution or AI training._  
_Brave query logs retained for 90 days. Zero Data Retention on Enterprise tier only._
