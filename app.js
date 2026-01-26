// DOM 요소
const koreanInput = document.getElementById('korean-input');
const englishInput = document.getElementById('english-input');
const addBtn = document.getElementById('add-btn');
const excelInput = document.getElementById('excel-input');
const wordList = document.getElementById('word-list');
const quizStartBtn = document.getElementById('quiz-start-btn');
const mainWrongBtn = document.getElementById('main-wrong-btn');
const mainWrongCount = document.getElementById('main-wrong-count');
const mainSection = document.getElementById('main-section');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');
const quizKorean = document.getElementById('quiz-korean');
const quizEnglish = document.getElementById('quiz-english');
const showBtn = document.getElementById('show-btn');
const correctBtn = document.getElementById('correct-btn');
const wrongBtn = document.getElementById('wrong-btn');
const quitBtn = document.getElementById('quit-btn');
const sentenceCount = document.getElementById('sentence-count');
const emptyMessage = document.getElementById('empty-message');

// 진행 상황 요소
const currentNum = document.getElementById('current-num');
const totalNum = document.getElementById('total-num');
const progressFill = document.getElementById('progress-fill');
const liveCorrect = document.getElementById('live-correct');
const liveWrong = document.getElementById('live-wrong');

// 결과 요소
const correctCountEl = document.getElementById('correct-count');
const wrongCountEl = document.getElementById('wrong-count');
const wrongListCount = document.getElementById('wrong-list-count');
const resultScore = document.getElementById('result-score');
const scrollHint = document.getElementById('scroll-hint');
const resultMessage = document.getElementById('result-message');
const retryBtn = document.getElementById('retry-btn');
const retryWrongBtn = document.getElementById('retry-wrong-btn');
const backBtn = document.getElementById('back-btn');
const wrongListSection = document.getElementById('wrong-list-section');
const wrongList = document.getElementById('wrong-list');

// 문장 데이터
let sentences = [];
let wrongSentences = []; // LocalStorage에 저장되는 틀린 문장
let currentSentence = null;

// 퀴즈 상태
let quizState = {
    currentIndex: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    questionPool: [],
    sessionWrong: [] // 현재 세션에서 틀린 문장 (결과 화면용)
};

// 삭제 대기 인덱스
let pendingDeleteIndex = null;

// 수정 관련
let pendingEditIndex = null;
const editModal = document.getElementById('edit-modal');
const editKoreanInput = document.getElementById('edit-korean-input');
const editEnglishInput = document.getElementById('edit-english-input');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editSaveBtn = document.getElementById('edit-save-btn');

// 휴지통 관련
let trashSentences = [];
const trashToggle = document.getElementById('trash-toggle');
const trashContent = document.getElementById('trash-content');
const trashList = document.getElementById('trash-list');
const trashCount = document.getElementById('trash-count');
const trashEmpty = document.getElementById('trash-empty');
const emptyTrashBtn = document.getElementById('empty-trash-btn');

// LocalStorage에서 문장 불러오기
function loadSentences() {
    const saved = localStorage.getItem('sentences');
    if (saved) {
        sentences = JSON.parse(saved);
    }
    renderSentenceList();
}

// LocalStorage에 문장 저장
function saveSentences() {
    localStorage.setItem('sentences', JSON.stringify(sentences));
}

// LocalStorage에서 틀린 문장 불러오기
function loadWrongSentences() {
    const saved = localStorage.getItem('wrongSentences');
    if (saved) {
        wrongSentences = JSON.parse(saved);
    }
    updateMainWrongCount();
}

// LocalStorage에 틀린 문장 저장
function saveWrongSentences() {
    localStorage.setItem('wrongSentences', JSON.stringify(wrongSentences));
    updateMainWrongCount();
}

// 메인 화면 틀린 문장 개수 업데이트
function updateMainWrongCount() {
    mainWrongCount.textContent = wrongSentences.length;
    if (wrongSentences.length === 0) {
        mainWrongBtn.disabled = true;
    } else {
        mainWrongBtn.disabled = false;
    }
}

// LocalStorage에서 휴지통 불러오기
function loadTrash() {
    const saved = localStorage.getItem('trashSentences');
    if (saved) {
        trashSentences = JSON.parse(saved);
    }
    renderTrashList();
}

// LocalStorage에 휴지통 저장
function saveTrash() {
    localStorage.setItem('trashSentences', JSON.stringify(trashSentences));
    renderTrashList();
}

// 휴지통 목록 렌더링
function renderTrashList() {
    trashList.innerHTML = '';
    trashCount.textContent = trashSentences.length;

    if (trashSentences.length === 0) {
        trashEmpty.style.display = 'block';
        emptyTrashBtn.disabled = true;
    } else {
        trashEmpty.style.display = 'none';
        emptyTrashBtn.disabled = false;
    }

    trashSentences.forEach((sentence, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="word-text">
                <span class="korean">${escapeHtml(sentence.korean)}</span>
                <span class="english">${escapeHtml(sentence.english)}</span>
            </span>
            <div class="trash-buttons">
                <button class="restore-btn" data-index="${index}">복원</button>
                <button class="permanent-delete-btn" data-index="${index}">삭제</button>
            </div>
        `;
        trashList.appendChild(li);
    });
}

// 휴지통 토글
function toggleTrash() {
    const isExpanded = trashToggle.getAttribute('aria-expanded') === 'true';
    trashToggle.setAttribute('aria-expanded', !isExpanded);
    trashContent.hidden = isExpanded;
}

// 휴지통으로 이동
function moveToTrash(index) {
    const sentence = sentences[index];
    trashSentences.push(sentence);
    sentences.splice(index, 1);
    saveSentences();
    saveTrash();
    renderSentenceList();
}

// 복원
function restoreFromTrash(index) {
    const sentence = trashSentences[index];
    sentences.push(sentence);
    trashSentences.splice(index, 1);
    saveSentences();
    saveTrash();
    renderSentenceList();
    showToast('문장이 복원되었습니다.');
}

// 완전 삭제
function permanentDelete(index) {
    trashSentences.splice(index, 1);
    saveTrash();
    showToast('문장이 완전히 삭제되었습니다.');
}

// 휴지통 비우기
function emptyTrash() {
    if (trashSentences.length === 0) return;
    trashSentences = [];
    saveTrash();
    showToast('휴지통을 비웠습니다.');
}

// XSS 방지
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 스크롤 힌트 업데이트
function updateScrollHint() {
    const listContainer = document.querySelector('.list-container');
    if (listContainer && scrollHint) {
        const hasScroll = listContainer.scrollHeight > listContainer.clientHeight;
        scrollHint.hidden = !hasScroll;
    }
}

// 문장 목록 렌더링
function renderSentenceList() {
    wordList.innerHTML = '';
    sentenceCount.textContent = sentences.length;

    if (sentences.length === 0) {
        emptyMessage.style.display = 'block';
        quizStartBtn.disabled = true;
    } else {
        emptyMessage.style.display = 'none';
        quizStartBtn.disabled = false;
    }

    sentences.forEach((sentence, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="word-text">
                <span class="korean">${escapeHtml(sentence.korean)}</span>
                <span class="english">${escapeHtml(sentence.english)}</span>
            </span>
            <div class="list-buttons">
                <button class="edit-btn" data-index="${index}" aria-label="${escapeHtml(sentence.korean)} 문장 수정">수정</button>
                <button class="delete-btn" data-index="${index}" aria-label="${escapeHtml(sentence.korean)} 문장 삭제">삭제</button>
            </div>
        `;
        wordList.appendChild(li);
    });

    // 스크롤 힌트 업데이트
    setTimeout(updateScrollHint, 100);
}

// 에러 메시지 표시
function showError(message) {
    let errorEl = document.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.setAttribute('role', 'alert');
        document.querySelector('.input-form').appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('visible');

    setTimeout(() => {
        errorEl.classList.remove('visible');
    }, 3000);
}

// 성공 토스트 표시
function showToast(message) {
    let toast = document.querySelector('.success-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'success-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 2000);
}

// 삭제 확인 모달 표시
function showDeleteConfirm(index) {
    pendingDeleteIndex = index;
    const sentence = sentences[index];

    let modal = document.getElementById('delete-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'delete-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <h3 id="modal-title">문장 삭제</h3>
                <p id="modal-desc"></p>
                <div class="modal-buttons">
                    <button class="modal-cancel">취소</button>
                    <button class="modal-confirm">삭제</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.modal-cancel').addEventListener('click', hideDeleteConfirm);
        modal.querySelector('.modal-confirm').addEventListener('click', confirmDelete);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideDeleteConfirm();
        });
    }

    modal.querySelector('#modal-desc').textContent = `"${sentence.korean}" 문장을 삭제할까요?`;
    modal.classList.add('visible');
    modal.querySelector('.modal-cancel').focus();
}

// 삭제 확인 모달 숨기기
function hideDeleteConfirm() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
    pendingDeleteIndex = null;
}

// 삭제 확정 (휴지통으로 이동)
function confirmDelete() {
    if (pendingDeleteIndex !== null) {
        moveToTrash(pendingDeleteIndex);
        hideDeleteConfirm();
        showToast('문장이 휴지통으로 이동되었습니다.');
    }
}

// 수정 모달 표시
function showEditModal(index) {
    pendingEditIndex = index;
    const sentence = sentences[index];

    editKoreanInput.value = sentence.korean;
    editEnglishInput.value = sentence.english;

    editModal.classList.add('visible');
    editKoreanInput.focus();
}

// 수정 모달 숨기기
function hideEditModal() {
    editModal.classList.remove('visible');
    pendingEditIndex = null;
}

// 수정 저장
function saveEdit() {
    if (pendingEditIndex === null) return;

    const korean = editKoreanInput.value.trim();
    const english = editEnglishInput.value.trim();

    if (!korean || !english) {
        showError('한글 문장과 영어 문장을 모두 입력해주세요.');
        return;
    }

    sentences[pendingEditIndex] = { korean, english };
    saveSentences();
    renderSentenceList();
    hideEditModal();
    showToast('문장이 수정되었습니다.');
}

// 에러 스타일 제거
function clearErrorOnInput(e) {
    e.target.classList.remove('error');
}

// 문장 추가
function addSentence() {
    const korean = koreanInput.value.trim();
    const english = englishInput.value.trim();

    // 구체적인 에러 메시지
    if (!korean && !english) {
        showError('한글 문장과 영어 문장을 모두 입력해주세요.');
        koreanInput.classList.add('error');
        englishInput.classList.add('error');
        koreanInput.focus();
        return;
    }

    if (!korean) {
        showError('한글 문장을 입력해주세요.');
        koreanInput.classList.add('error');
        koreanInput.focus();
        return;
    }

    if (!english) {
        showError('영어 문장을 입력해주세요.');
        englishInput.classList.add('error');
        englishInput.focus();
        return;
    }

    // 에러 스타일 제거
    koreanInput.classList.remove('error');
    englishInput.classList.remove('error');

    sentences.push({ korean, english });
    saveSentences();
    renderSentenceList();

    koreanInput.value = '';
    englishInput.value = '';
    koreanInput.focus();

    showToast('문장이 추가되었습니다!');
}

// 문장 삭제
function deleteSentence(index) {
    sentences.splice(index, 1);
    saveSentences();
    renderSentenceList();
}

// 퀴즈 시작 (전체)
function startQuiz() {
    if (sentences.length === 0) {
        showError('먼저 문장을 추가해주세요.');
        return;
    }

    // 퀴즈 상태 초기화
    quizState = {
        currentIndex: 0,
        totalQuestions: sentences.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionPool: [...sentences].sort(() => Math.random() - 0.5),
        sessionWrong: []
    };

    mainSection.style.display = 'none';
    resultSection.style.display = 'none';
    quizSection.style.display = 'block';

    totalNum.textContent = quizState.totalQuestions;
    updateProgress();
    nextQuestion();
}

// 틀린 문장만 테스트 (메인 화면에서)
function startQuizWithWrongFromMain() {
    if (wrongSentences.length === 0) {
        showError('틀린 문장이 없습니다.');
        return;
    }

    quizState = {
        currentIndex: 0,
        totalQuestions: wrongSentences.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionPool: [...wrongSentences].sort(() => Math.random() - 0.5),
        sessionWrong: []
    };

    mainSection.style.display = 'none';
    resultSection.style.display = 'none';
    quizSection.style.display = 'block';

    totalNum.textContent = quizState.totalQuestions;
    updateProgress();
    nextQuestion();
}

// 틀린 문장만 다시 테스트 (결과 화면에서)
function startQuizWithWrong() {
    if (quizState.sessionWrong.length === 0) {
        return;
    }

    const wrongPool = [...quizState.sessionWrong];
    quizState = {
        currentIndex: 0,
        totalQuestions: wrongPool.length,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionPool: wrongPool.sort(() => Math.random() - 0.5),
        sessionWrong: []
    };

    resultSection.style.display = 'none';
    quizSection.style.display = 'block';

    totalNum.textContent = quizState.totalQuestions;
    updateProgress();
    nextQuestion();
}

// 진행 상황 업데이트
function updateProgress() {
    currentNum.textContent = quizState.currentIndex + 1;
    const percent = (quizState.currentIndex / quizState.totalQuestions) * 100;
    progressFill.style.width = percent + '%';

    const progressBar = document.querySelector('.progress-bar');
    progressBar.setAttribute('aria-valuenow', Math.round(percent));

    // 실시간 점수 업데이트
    if (liveCorrect) liveCorrect.textContent = quizState.correctAnswers;
    if (liveWrong) liveWrong.textContent = quizState.wrongAnswers;
}

// 다음 문제
function nextQuestion() {
    if (quizState.currentIndex >= quizState.totalQuestions) {
        showResults();
        return;
    }

    currentSentence = quizState.questionPool[quizState.currentIndex];

    quizKorean.textContent = currentSentence.korean;
    quizEnglish.textContent = currentSentence.english;

    // 정답 숨기기
    quizEnglish.classList.remove('visible');
    quizEnglish.setAttribute('aria-hidden', 'true');
    showBtn.style.display = 'inline-block';
    showBtn.setAttribute('aria-expanded', 'false');

    // 알았어요/모르겠어요 버튼 비활성화
    correctBtn.disabled = true;
    wrongBtn.disabled = true;

    updateProgress();
    quizKorean.focus();
}

// 정답 보기
function showAnswer() {
    quizEnglish.classList.add('visible');
    quizEnglish.setAttribute('aria-hidden', 'false');
    showBtn.style.display = 'none';
    showBtn.setAttribute('aria-expanded', 'true');

    // 버튼 활성화
    correctBtn.disabled = false;
    wrongBtn.disabled = false;
    correctBtn.focus();
}

// 정답 처리
function handleCorrect() {
    quizState.correctAnswers++;
    quizState.currentIndex++;
    nextQuestion();
}

// 문장이 이미 틀린 목록에 있는지 확인
function isInWrongList(sentence) {
    return wrongSentences.some(s => s.korean === sentence.korean && s.english === sentence.english);
}

// 틀린 문장 목록에 추가
function addToWrongList(sentence) {
    if (!isInWrongList(sentence)) {
        wrongSentences.push(sentence);
        saveWrongSentences();
    }
}

function handleWrong() {
    quizState.wrongAnswers++;
    quizState.sessionWrong.push(currentSentence);

    // 전역 틀린 문장 목록에 추가
    addToWrongList(currentSentence);

    quizState.currentIndex++;
    nextQuestion();
}

// 틀린 문장에서 삭제
function deleteFromWrongList(index) {
    wrongSentences.splice(index, 1);
    saveWrongSentences();
    renderWrongList();
    showToast('복습 목록에서 삭제되었습니다.');
}

// 틀린 문장 목록 렌더링
function renderWrongList() {
    wrongList.innerHTML = '';

    if (quizState.sessionWrong.length === 0) {
        wrongListSection.style.display = 'none';
        retryWrongBtn.style.display = 'none';
        return;
    }

    wrongListSection.style.display = 'block';
    retryWrongBtn.style.display = 'block';

    // 틀린 문장 개수 표시
    if (wrongListCount) {
        wrongListCount.textContent = quizState.sessionWrong.length + '개';
    }

    quizState.sessionWrong.forEach((sentence, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="wrong-item-content">
                <span class="korean">${escapeHtml(sentence.korean)}</span>
                <span class="english">${escapeHtml(sentence.english)}</span>
            </div>
            <button class="wrong-delete-btn" data-korean="${escapeHtml(sentence.korean)}" data-english="${escapeHtml(sentence.english)}" aria-label="${escapeHtml(sentence.korean)} 복습 목록에서 삭제">삭제</button>
        `;
        wrongList.appendChild(li);
    });
}

// 결과 표시
function showResults() {
    quizSection.style.display = 'none';
    resultSection.style.display = 'block';

    correctCountEl.textContent = quizState.correctAnswers;
    wrongCountEl.textContent = quizState.wrongAnswers;

    const percentage = Math.round((quizState.correctAnswers / quizState.totalQuestions) * 100);

    let message = '';
    if (percentage === 100) {
        message = '완벽해요! 모든 문장을 알고 있어요! 🎉';
    } else if (percentage >= 80) {
        message = '잘하고 있어요! 조금만 더 복습하면 완벽해질 거예요.';
    } else if (percentage >= 60) {
        message = '좋아요! 꾸준히 연습하면 더 나아질 거예요.';
    } else {
        message = '괜찮아요! 다시 복습하고 도전해보세요.';
    }

    resultMessage.textContent = message;

    // 틀린 문장 목록 표시
    renderWrongList();

    if (quizState.sessionWrong.length > 0) {
        retryWrongBtn.focus();
    } else {
        retryBtn.focus();
    }
}

// 퀴즈 종료
function quitQuiz() {
    if (quizState.currentIndex > 0) {
        showResults();
    } else {
        quizSection.style.display = 'none';
        mainSection.style.display = 'block';
        koreanInput.focus();
    }
}

// 메인으로 돌아가기
function backToMain() {
    resultSection.style.display = 'none';
    mainSection.style.display = 'block';
    updateMainWrongCount();
    koreanInput.focus();
}

// 이벤트 리스너
addBtn.addEventListener('click', addSentence);

koreanInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') englishInput.focus();
});
koreanInput.addEventListener('input', clearErrorOnInput);

englishInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSentence();
});
englishInput.addEventListener('input', clearErrorOnInput);

wordList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        showDeleteConfirm(index);
    } else if (e.target.classList.contains('edit-btn')) {
        const index = parseInt(e.target.dataset.index);
        showEditModal(index);
    }
});

// 틀린 문장 목록에서 삭제 버튼
wrongList.addEventListener('click', (e) => {
    if (e.target.classList.contains('wrong-delete-btn')) {
        const korean = e.target.dataset.korean;
        const english = e.target.dataset.english;

        // wrongSentences에서 찾아서 삭제
        const index = wrongSentences.findIndex(s => s.korean === korean && s.english === english);
        if (index !== -1) {
            deleteFromWrongList(index);
        }

        // sessionWrong에서도 삭제
        const sessionIndex = quizState.sessionWrong.findIndex(s => s.korean === korean && s.english === english);
        if (sessionIndex !== -1) {
            quizState.sessionWrong.splice(sessionIndex, 1);
            renderWrongList();
        }
    }
});

quizStartBtn.addEventListener('click', startQuiz);
mainWrongBtn.addEventListener('click', startQuizWithWrongFromMain);
showBtn.addEventListener('click', showAnswer);
correctBtn.addEventListener('click', handleCorrect);
wrongBtn.addEventListener('click', handleWrong);
quitBtn.addEventListener('click', quitQuiz);
retryBtn.addEventListener('click', startQuiz);
retryWrongBtn.addEventListener('click', startQuizWithWrong);
backBtn.addEventListener('click', backToMain);

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // 퀴즈 화면에서만
    if (quizSection.style.display === 'block') {
        if (e.key === ' ' || e.key === 'Enter') {
            if (showBtn.style.display !== 'none') {
                e.preventDefault();
                showAnswer();
            }
        } else if (e.key === 'x' || e.key === 'X') {
            if (!wrongBtn.disabled) {
                handleWrong();
            }
        } else if (e.key === 'o' || e.key === 'O') {
            if (!correctBtn.disabled) {
                handleCorrect();
            }
        } else if (e.key === 'Escape') {
            quitQuiz();
        }
    }

    // 삭제 모달에서 ESC
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal && deleteModal.classList.contains('visible') && e.key === 'Escape') {
        hideDeleteConfirm();
    }

    // 수정 모달에서 ESC
    if (editModal.classList.contains('visible') && e.key === 'Escape') {
        hideEditModal();
    }
});

// 엑셀 파일 업로드 처리
function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 첫 번째 시트 가져오기
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // JSON으로 변환
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            let addedCount = 0;
            let skippedCount = 0;

            // 각 행을 문장으로 추가
            jsonData.forEach((row, index) => {
                const korean = row[0] ? String(row[0]).trim() : '';
                const english = row[1] ? String(row[1]).trim() : '';

                if (korean && english) {
                    // 중복 체크
                    const isDuplicate = sentences.some(s =>
                        s.korean === korean && s.english === english
                    );

                    if (!isDuplicate) {
                        sentences.push({ korean, english });
                        addedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            });

            if (addedCount > 0) {
                saveSentences();
                renderSentenceList();
                showToast(`${addedCount}개 문장 추가됨` + (skippedCount > 0 ? ` (중복 ${skippedCount}개 제외)` : ''));
            } else if (skippedCount > 0) {
                showToast(`모두 중복된 문장입니다.`);
            } else {
                showError('유효한 데이터가 없습니다. A열(한글), B열(영어)를 확인해주세요.');
            }
        } catch (error) {
            console.error('Excel parsing error:', error);
            showError('엑셀 파일을 읽을 수 없습니다.');
        }

        // 파일 입력 초기화 (같은 파일 다시 선택 가능하게)
        e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
}

excelInput.addEventListener('change', handleExcelUpload);

// 수정 모달 이벤트
editCancelBtn.addEventListener('click', hideEditModal);
editSaveBtn.addEventListener('click', saveEdit);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideEditModal();
});
editEnglishInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});

// 휴지통 이벤트
trashToggle.addEventListener('click', toggleTrash);
emptyTrashBtn.addEventListener('click', emptyTrash);
trashList.addEventListener('click', (e) => {
    if (e.target.classList.contains('restore-btn')) {
        const index = parseInt(e.target.dataset.index);
        restoreFromTrash(index);
    } else if (e.target.classList.contains('permanent-delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        permanentDelete(index);
    }
});

// 초기화
loadSentences();
loadWrongSentences();
loadTrash();