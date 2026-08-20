import streamlit as st
import requests
import re
import json
import os

st.set_page_config(page_title="Quran & Hadith Assistant", page_icon="☪️", layout="wide")

# --- DATA LOADING (CACHED) ---
@st.cache_data
def load_quran():
    try:
        with open("data/quran_eng.json", "r", encoding="utf-8") as f:
            eng = json.load(f)["data"]["surahs"]
        with open("data/quran_ara.json", "r", encoding="utf-8") as f:
            ara = json.load(f)["data"]["surahs"]
        return eng, ara
    except Exception as e:
        return None, None

@st.cache_data
def load_hadith(book):
    try:
        with open(f"data/hadith_{book}.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return None

# --- SIDEBAR NAVIGATION ---
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to:",
    ["AI Chat Assistant", "Read Quran", "Read Hadiths"]
)

st.sidebar.divider()
st.sidebar.caption("Powered by Groq, Gemini & ChromaDB")

# --- PAGE: AI CHAT ASSISTANT ---
if page == "AI Chat Assistant":
    st.title("Quran & Hadith Assistant")

    # Model selection in the main view
    col1, col2 = st.columns([1, 3])
    with col1:
        provider_choice = st.selectbox(
            "Model",
            ("Groq (Qwen 3.6 27B)", "Google Gemini"),
            label_visibility="collapsed"
        )

    provider_map = {
        "Groq (Qwen 3.6 27B)": "groq",
        "Google Gemini": "gemini"
    }
    selected_provider = provider_map[provider_choice]

    st.write("Ask questions about Islam, and get answers strictly from the Quran and authentic Hadiths.")

    API_URL = "http://localhost:8000/chat"

    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat messages from history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # React to user input
    if prompt := st.chat_input("What is your question?"):
        st.chat_message("user").markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})

        with st.chat_message("assistant"):
            with st.spinner("Searching scriptures..."):
                try:
                    response = requests.post(API_URL, json={"query": prompt, "provider": selected_provider})
                    if response.status_code == 200:
                        data = response.json()
                        raw_answer = data["answer"]
                        sources = data["sources"]

                        # Extract <think> blocks
                        think_match = re.search(r"<think>(.*?)</think>", raw_answer, flags=re.DOTALL)
                        if think_match:
                            thinking_process = think_match.group(1).strip()
                            final_answer = re.sub(r"<think>.*?</think>", "", raw_answer, flags=re.DOTALL).strip()

                            with st.expander("View AI Thinking Process"):
                                st.markdown(thinking_process)

                            st.markdown(final_answer)
                        else:
                            final_answer = raw_answer
                            st.markdown(final_answer)

                        with st.expander("View Sources"):
                            for idx, source in enumerate(sources):
                                st.markdown(f"**Source {idx+1}: {source['metadata'].get('source', 'Unknown')}**")
                                st.text(source['content'])
                                st.markdown("---")

                        st.session_state.messages.append({"role": "assistant", "content": final_answer})
                    else:
                        error_msg = f"Error from server: {response.text}"
                        st.error(error_msg)
                        st.session_state.messages.append({"role": "assistant", "content": error_msg})
                except requests.exceptions.ConnectionError:
                    st.error("Failed to connect to the backend API. Ensure FastAPI is running on port 8000.")


# --- PAGE: READ QURAN ---
elif page == "Read Quran":
    st.title("Read the Holy Quran")

    eng_surahs, ara_surahs = load_quran()

    if eng_surahs and ara_surahs:
        # Create a dropdown mapping index to Surah name
        surah_names = [f"{s['number']}. {s['englishName']} ({s['englishNameTranslation']})" for s in eng_surahs]
        selected_idx = st.selectbox("Select Surah", range(len(surah_names)), format_func=lambda x: surah_names[x])

        st.divider()

        eng_ayahs = eng_surahs[selected_idx]["ayahs"]
        ara_ayahs = ara_surahs[selected_idx]["ayahs"]

        # Display the ayahs
        for e, a in zip(eng_ayahs, ara_ayahs):
            st.markdown(f"**Ayah {e['numberInSurah']}**")
            # Arabic text right-aligned with larger font
            st.markdown(f"<h3 style='text-align: right; direction: rtl; font-family: serif; color: #1f77b4;'>{a['text']}</h3>", unsafe_allow_html=True)
            # English translation
            st.markdown(f"*{e['text']}*")
            st.divider()
    else:
        st.error("Quran data not found. Please ensure download_data.py has been run successfully.")


# --- PAGE: READ HADITHS ---
elif page == "Read Hadiths":
    st.title("Read Authentic Hadiths")

    # Removed ibnmajah as it's currently unavailable
    books = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai"]

    # Layout controls in a single line
    col_book, col_chap, col_num = st.columns([1, 2, 1])

    with col_book:
        selected_book = st.selectbox("Collection", books, format_func=lambda x: x.capitalize())

    hadith_data = load_hadith(selected_book)

    if hadith_data and "hadiths" in hadith_data:
        metadata = hadith_data.get("metadata", {})
        book_title = metadata.get("english", {}).get("title", selected_book.capitalize())

        hadiths = hadith_data.get("hadiths", [])
        chapters_list = hadith_data.get("chapters", [])
        chapters = {str(c.get("id")): c for c in chapters_list} if isinstance(chapters_list, list) else chapters_list

        # --- Chapter / Book Classification Dropdown ---
        chapter_counts = {}
        for h_item in hadiths:
            cid = str(h_item.get("chapterId", ""))
            chapter_counts[cid] = chapter_counts.get(cid, 0) + 1

        chapter_options = [("All", f"All Chapters ({len(hadiths)} hadiths)")]
        if isinstance(chapters_list, list):
            for c in chapters_list:
                c_id = str(c.get("id", ""))
                c_name = c.get("english", f"Chapter {c_id}")
                count = chapter_counts.get(c_id, 0)
                if count > 0:
                    chapter_options.append((c_id, f"{c_name} ({count} hadiths)"))

        with col_chap:
            selected_chapter = st.selectbox("Book/Chapter", chapter_options, format_func=lambda x: x[1])

        if selected_chapter[0] != "All":
            chapter_indices = [i for i, h in enumerate(hadiths) if str(h.get("chapterId", "")) == selected_chapter[0]]
        else:
            chapter_indices = list(range(len(hadiths)))

        if not chapter_indices:
            st.info("No hadiths found in this section.")
        else:
            min_num = chapter_indices[0] + 1
            max_num = chapter_indices[-1] + 1

            with col_num:
                selected_num = st.number_input(
                    "Global Hadith No.",
                    min_value=min_num,
                    max_value=max_num,
                    value=min_num
                )

            h = hadiths[selected_num - 1]

            # Chapter Information
            chapter_id = str(h.get("chapterId", ""))
            chapter_info = chapters.get(chapter_id, {})
            chapter_eng = chapter_info.get("english", "")
            chapter_ara = chapter_info.get("arabic", "")

            st.divider()

            # Sunnah.com style Chapter Header
            if chapter_eng or chapter_ara:
                st.markdown(
                    f"<div style='background-color: #2c3035; padding: 15px; border-radius: 5px; color: white; display: flex; justify-content: space-between;'>"
                    f"<div style='text-align: left; flex: 1; padding-right: 20px;'>{chapter_eng}</div>"
                    f"<div style='text-align: right; direction: rtl; font-family: serif; font-size: 20px; flex: 1;'>{chapter_ara}</div>"
                    f"</div>",
                    unsafe_allow_html=True
                )
                st.write("") # spacing

            # Sunnah.com style Hadith Body (English Left, Arabic Right)
            h_col_eng, h_col_ara = st.columns(2)

            with h_col_eng:
                eng_data = h.get("english", {})
                narrator = eng_data.get("narrator", "")
                text = eng_data.get("text", "")

                # Fix Streamlit Markdown highlighting text as green code blocks when encountering backticks `
                text = text.replace("`", "'")

                if narrator:
                    st.markdown(f"**{narrator}**")
                st.write(text)

            with h_col_ara:
                ara_text = h.get("arabic", "")
                st.markdown(f"<div style='text-align: right; direction: rtl; font-family: serif; font-size: 24px; line-height: 1.8;'>{ara_text}</div>", unsafe_allow_html=True)

            st.write("")
            st.caption(f"**Reference:** {book_title} {h.get('idInBook', h.get('id', 'Unknown'))}")

    else:
        st.warning("Loading Hadith data... If this persists, please ensure `download_data.py` has finished running to fetch the new datasets.")
