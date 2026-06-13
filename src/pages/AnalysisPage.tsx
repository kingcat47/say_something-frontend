import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import styles from './AnalysisPage.module.scss';

// Chart.js의 모든 컨트롤러/스케일/플러그인을 전역 등록
// (tree-shaking이 필요하면 필요한 것만 골라서 등록 가능)
Chart.register(...registerables);

// ─── 시뮬레이션 상수 ───────────────────────────────────────────
// 실제 앱이 상정하는 기준 해상도 (poissonDisk.ts와 동일 값 사용)
const SCREEN_W = 1280;
const SCREEN_H = 720;
const MAX_LEFT = 80;           // vw 기준 최대 left (오른쪽 여백 확보)
const MAX_TOP = SCREEN_H - 100; // 하단 UI 영역 제외한 배치 가능 높이
const MAX_ATTEMPTS = 30;        // 한 메시지당 최대 배치 시도 횟수
const MSG_W = 180;              // 메시지 박스 가정 너비 (px)
const MSG_H = 40;               // 메시지 박스 가정 높이 (px)

// ─── 타입 정의 ────────────────────────────────────────────────
interface Pos { left: number; top: number; }                          // vw/px 단위 위치
interface Rect { x: number; y: number; w: number; h: number; }        // px 단위 절대 사각형
interface SimParams { msgCount: number; simCount: number; gap: number; } // 슬라이더 파라미터

// ─── 순수 유틸 함수 (poissonDisk.ts 동일 로직, React 의존성 없음) ───

/**
 * vw/px 단위 Pos → px 단위 절대 Rect 변환.
 * @param left - 메시지 left 위치 (vw, 0~100)
 * @param top  - 메시지 top 위치 (px)
 * @returns    - Chart.js / 겹침 계산에 사용할 px 단위 절대 사각형
 */
function toRect(left: number, top: number): Rect {
    return { x: (left / 100) * SCREEN_W, y: top, w: MSG_W, h: MSG_H };
}

/**
 * AABB(축 정렬 경계 박스) 겹침 검사.
 * gap만큼의 여백도 겹침으로 처리해 메시지 사이 최소 간격을 보장한다.
 * @param a   - 첫 번째 메시지 사각형 (px 단위)
 * @param b   - 두 번째 메시지 사각형 (px 단위)
 * @param gap - 두 메시지 사이에 강제할 최소 여백 (px)
 * @returns   - 겹치거나 gap 이내면 true, 충분히 떨어져 있으면 false
 */
function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
    return !(
        a.x + a.w + gap < b.x ||
        b.x + b.w + gap < a.x ||
        a.y + a.h + gap < b.y ||
        b.y + b.h + gap < a.y
    );
}

/**
 * 두 Rect 중심점 간 유클리드 거리.
 * @param a - 첫 번째 사각형
 * @param b - 두 번째 사각형
 * @returns - 두 중심점 사이의 거리 (px)
 */
function centerDist(a: Rect, b: Rect): number {
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 배치 가능 영역 내 균등 무작위 위치 생성.
 * @returns - left(vw), top(px) 형태의 랜덤 위치
 */
function randomPos(): Pos {
    return { left: Math.random() * MAX_LEFT, top: Math.random() * MAX_TOP };
}

/**
 * Poisson Disk Sampling 기반 배치 후보 선택.
 *
 * MAX_ATTEMPTS번 랜덤 후보를 뽑아:
 *   1) 겹침 없는 후보가 나오면 즉시 반환 (best case)
 *   2) 모두 겹치면 기존 메시지들과 가장 멀리 떨어진 후보를 반환 (fallback)
 *
 * @param existing - 이미 배치된 메시지 위치 배열 (빈 배열이면 첫 메시지)
 * @param gap      - 메시지 간 최소 여백 (px), rectsOverlap에 그대로 전달
 * @returns        - pos: 선택된 배치 위치 / attempts: 실제 시도 횟수 (성능 분석용)
 */
function poissonPos(existing: Pos[], gap: number): { pos: Pos; attempts: number } {
    let bestPos = randomPos();
    let bestMinDist = -Infinity;
    let usedAttempts = 0;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        usedAttempts++;
        const candidate = randomPos();
        const cRect = toRect(candidate.left, candidate.top);

        let hasOverlap = false;
        let minDist = Infinity;

        for (const msg of existing) {
            const eRect = toRect(msg.left, msg.top);
            if (rectsOverlap(cRect, eRect, gap)) hasOverlap = true;
            const d = centerDist(cRect, eRect);
            if (d < minDist) minDist = d;
        }

        // 첫 번째 메시지는 비교 대상 없으므로 항상 배치 성공
        if (existing.length === 0) minDist = Infinity;
        if (!hasOverlap) return { pos: candidate, attempts: usedAttempts };

        // fallback: 지금까지 본 후보 중 가장 넓은 자리 기억
        if (minDist > bestMinDist) {
            bestMinDist = minDist;
            bestPos = candidate;
        }
    }

    // MAX_ATTEMPTS 소진 → 그나마 제일 나은 자리에 강제 배치
    return { pos: bestPos, attempts: MAX_ATTEMPTS };
}

/**
 * 메시지 배열 내 겹치는 쌍이 하나라도 있는지 검사.
 * 겹침 발생률 시뮬레이션에서 해당 배치 시도의 성공/실패 판정에 사용한다.
 * @param msgs - 검사할 메시지 위치 배열
 * @param gap  - 겹침 판정 기준 최소 여백 (px)
 * @returns    - 겹치는 쌍이 하나라도 있으면 true
 */
function hasAnyOverlap(msgs: Pos[], gap: number): boolean {
    for (let i = 0; i < msgs.length; i++) {
        for (let j = i + 1; j < msgs.length; j++) {
            if (rectsOverlap(toRect(msgs[i].left, msgs[i].top), toRect(msgs[j].left, msgs[j].top), gap)) return true;
        }
    }
    return false;
}

/**
 * 메시지 배열에서 가장 가까운 두 메시지 사이의 중심 거리 반환.
 * 값이 클수록 메시지들이 고르게 퍼져 있다는 의미 — 최소 거리 히스토그램의 입력값으로 사용.
 * @param msgs - 측정할 메시지 위치 배열
 * @returns    - 가장 가까운 두 메시지의 중심 간 거리 (px). 메시지가 1개 이하면 0 반환.
 */
function minPairDist(msgs: Pos[]): number {
    let min = Infinity;
    for (let i = 0; i < msgs.length; i++) {
        for (let j = i + 1; j < msgs.length; j++) {
            const d = centerDist(toRect(msgs[i].left, msgs[i].top), toRect(msgs[j].left, msgs[j].top));
            if (d < min) min = d;
        }
    }
    return min === Infinity ? 0 : min;
}

/**
 * 연속형 데이터를 균등 구간(bin)으로 나눠 도수 히스토그램 생성.
 * @param data     - 원본 수치 배열 (minPairDist 결과값 등)
 * @param binCount - 구간 수 (막대 개수)
 * @param maxVal   - 히스토그램 상한 (px). 이를 넘는 값은 마지막 bin에 합산
 * @returns        - 길이 binCount인 배열, 각 요소는 해당 구간에 속하는 데이터 개수
 */
function buildHistogram(data: number[], binCount: number, maxVal: number): number[] {
    const counts = new Array(binCount).fill(0);
    const binSize = maxVal / binCount;
    for (const v of data) {
        const idx = Math.min(Math.floor(v / binSize), binCount - 1);
        counts[idx]++;
    }
    return counts;
}

// ─── 시뮬레이션 실행 ───────────────────────────────────────────
/**
 * 4가지 지표를 한 번에 계산해 차트 데이터로 반환한다.
 * UI와 완전히 분리된 순수 함수이므로 단위 테스트 가능.
 * @param params - 슬라이더에서 받은 시뮬레이션 설정값 (msgCount, simCount, gap)
 * @returns      - 각 차트에 바로 넘길 수 있는 데이터 집합:
 *                   scatterRandom/scatterPoisson  - 공간 분포 산점도용 위치 배열
 *                   overlapRandom/overlapPoisson  - 메시지 수별 겹침 발생률(%) 배열
 *                   rDists/pDists                 - 시뮬레이션별 최소 쌍 거리 배열 (히스토그램 원본)
 *                   fillLevels/avgAttempts        - 밀집도(x축)와 평균 시도 횟수(y축) 배열
 */
function runSimulation(params: SimParams) {
    const { msgCount, simCount, gap } = params;

    // ── 1. 공간 분포 ──────────────────────────────────────────
    // 1회 시뮬레이션으로 랜덤 vs Poisson Disk 위치 분포를 산점도로 비교
    const scatterRandom: Pos[] = [];
    const scatterPoisson: Pos[] = [];
    for (let i = 0; i < msgCount; i++) {
        scatterRandom.push(randomPos());
        scatterPoisson.push(poissonPos(scatterPoisson, gap).pos);
    }

    // ── 2. 겹침 발생률 ───────────────────────────────────────
    // 메시지 수 n = 1~25에서 simCount회 반복 → 겹침이 한 번이라도 발생한 비율(%)
    const overlapRandom: number[] = [];
    const overlapPoisson: number[] = [];
    for (let n = 1; n <= 25; n++) {
        let rCnt = 0, pCnt = 0;
        for (let s = 0; s < simCount; s++) {
            const rm: Pos[] = [], pm: Pos[] = [];
            for (let i = 0; i < n; i++) {
                rm.push(randomPos());
                pm.push(poissonPos(pm, gap).pos);
            }
            if (hasAnyOverlap(rm, gap)) rCnt++;
            if (hasAnyOverlap(pm, gap)) pCnt++;
        }
        overlapRandom.push(+((rCnt / simCount) * 100).toFixed(1));
        overlapPoisson.push(+((pCnt / simCount) * 100).toFixed(1));
    }

    // ── 3. 최소 거리 분포 ────────────────────────────────────
    // simCount회 배치 후 각 시뮬레이션의 최소 쌍 거리를 수집 → 히스토그램용
    const rDists: number[] = [], pDists: number[] = [];
    for (let s = 0; s < simCount; s++) {
        const rm: Pos[] = [], pm: Pos[] = [];
        for (let i = 0; i < msgCount; i++) {
            rm.push(randomPos());
            pm.push(poissonPos(pm, gap).pos);
        }
        rDists.push(minPairDist(rm));
        pDists.push(minPairDist(pm));
    }

    // ── 4. 밀집도별 평균 시도 횟수 ───────────────────────────
    // 기존 메시지 수(fill)를 0→24로 늘려가며, 새 메시지 1개를 배치하는 데
    // 필요한 평균 시도 횟수를 100회 평균으로 측정 → 알고리즘 성능 지표
    const fillLevels: number[] = [];
    const avgAttempts: number[] = [];
    for (let fill = 0; fill <= 24; fill++) {
        let total = 0;
        const TRIALS = 100;
        for (let t = 0; t < TRIALS; t++) {
            const existing: Pos[] = Array.from({ length: fill }, () => randomPos());
            total += poissonPos(existing, gap).attempts;
        }
        fillLevels.push(fill);
        avgAttempts.push(+(total / TRIALS).toFixed(2));
    }

    return { scatterRandom, scatterPoisson, overlapRandom, overlapPoisson, rDists, pDists, fillLevels, avgAttempts };
}

// ─── 컴포넌트 ─────────────────────────────────────────────────
export default function AnalysisPage() {
    const INIT: SimParams = { msgCount: 15, simCount: 200, gap: 10 };

    // display: 슬라이더 숫자를 즉시 반영 (렌더링 딜레이 없이 UX 유지)
    // params: 실제 시뮬레이션 트리거 — debounce 후에만 변경돼 불필요한 연산 방지
    const [display, setDisplay] = useState<SimParams>(INIT);
    const [params, setParams]   = useState<SimParams>(INIT);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 각 canvas 요소에 대한 ref — Chart.js는 DOM 캔버스에 직접 그린다
    const scatterRef    = useRef<HTMLCanvasElement>(null);
    const overlapRef    = useRef<HTMLCanvasElement>(null);
    const minDistRef    = useRef<HTMLCanvasElement>(null);
    const attemptsRef   = useRef<HTMLCanvasElement>(null);
    // Chart 인스턴스를 ref로 관리 — 재렌더링 전에 destroy()로 메모리 누수 방지
    const chartsRef     = useRef<(Chart | null)[]>([null, null, null, null]);

    // 다른 페이지에서 overflow: hidden이 걸려 있어도 분석 페이지에서는 스크롤 가능하게 해제
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = prev; };
    }, []);

    /**
     * 슬라이더 변경 핸들러: 표시값은 즉시, 시뮬레이션은 400ms debounce 후 실행.
     * @param key   - 변경된 파라미터 이름 ('msgCount' | 'simCount' | 'gap')
     * @param value - 슬라이더의 새 값 (숫자)
     */
    const handleSlider = (key: keyof SimParams, value: number) => {
        setDisplay(p => ({ ...p, [key]: value }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setParams(p => ({ ...p, [key]: value }));
        }, 400);
    };

    // params가 바뀔 때마다 시뮬레이션 재실행 및 차트 재렌더링
    useEffect(() => {
        // 이전 차트 인스턴스 정리 (canvas 재사용 시 "Canvas already in use" 오류 방지)
        chartsRef.current.forEach(c => c?.destroy());
        chartsRef.current = [null, null, null, null];

        const d = runSimulation(params);

        // 히스토그램 설정: 0~500px 구간을 12개 bin으로 분할
        const BIN_N = 12;
        const MAX_DIST = 500;
        const rHist = buildHistogram(d.rDists, BIN_N, MAX_DIST);
        const pHist = buildHistogram(d.pDists, BIN_N, MAX_DIST);
        const distLabels = Array.from({ length: BIN_N }, (_, i) =>
            `${Math.round(i * MAX_DIST / BIN_N)}`
        );

        // Tableau 10 팔레트 — 색약 친화적이고 인쇄 시에도 구분 가능한 색상
        const RED   = { border: 'rgb(242,142,43)',  bg: 'rgba(242,142,43,0.12)' }; // #F28E2B (orange)
        const BLUE  = { border: 'rgb(78,121,167)',  bg: 'rgba(78,121,167,0.12)' }; // #4E79A7 (blue)
        const GREEN = { border: 'rgb(118,183,178)', bg: 'rgba(118,183,178,0.15)' }; // #76B7B2 (teal)

        // ── 차트 1: 공간 분포 산점도 ──────────────────────────
        if (scatterRef.current) {
            chartsRef.current[0] = new Chart(scatterRef.current, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: '랜덤',
                            data: d.scatterRandom.map(m => ({ x: Math.round((m.left / 100) * SCREEN_W), y: Math.round(m.top) })),
                            backgroundColor: 'rgba(242,142,43,0.75)',
                            pointRadius: 7,
                        },
                        {
                            label: 'Poisson Disk',
                            data: d.scatterPoisson.map(m => ({ x: Math.round((m.left / 100) * SCREEN_W), y: Math.round(m.top) })),
                            backgroundColor: 'rgba(78,121,167,0.85)',
                            pointRadius: 7,
                        },
                    ],
                },
                options: {
                    animation: false, // 슬라이더 조작 시 깜빡임 방지
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { min: 0, max: SCREEN_W, title: { display: true, text: 'X (px)' } },
                        y: { min: 0, max: MAX_TOP,  title: { display: true, text: 'Y (px)' } },
                    },
                },
            });
        }

        // ── 차트 2: 겹침 발생률 꺾은선 ───────────────────────
        if (overlapRef.current) {
            chartsRef.current[1] = new Chart(overlapRef.current, {
                type: 'line',
                data: {
                    labels: Array.from({ length: 25 }, (_, i) => i + 1),
                    datasets: [
                        { label: '랜덤',         data: d.overlapRandom,  borderColor: RED.border,  backgroundColor: RED.bg,  tension: 0.3, fill: true },
                        { label: 'Poisson Disk', data: d.overlapPoisson, borderColor: BLUE.border, backgroundColor: BLUE.bg, tension: 0.3, fill: true },
                    ],
                },
                options: {
                    animation: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { title: { display: true, text: '동시 메시지 수' } },
                        y: { min: 0, max: 100, title: { display: true, text: '겹침 발생률 (%)' } },
                    },
                },
            });
        }

        // ── 차트 3: 최소 거리 히스토그램 ─────────────────────
        if (minDistRef.current) {
            chartsRef.current[2] = new Chart(minDistRef.current, {
                type: 'bar',
                data: {
                    labels: distLabels,
                    datasets: [
                        { label: '랜덤',         data: rHist, backgroundColor: 'rgba(242,142,43,0.75)' },
                        { label: 'Poisson Disk', data: pHist, backgroundColor: 'rgba(78,121,167,0.85)' },
                    ],
                },
                options: {
                    animation: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { title: { display: true, text: '최소 거리 (px)' } },
                        y: { title: { display: true, text: '빈도' } },
                    },
                },
            });
        }

        // ── 차트 4: 밀집도별 평균 시도 횟수 꺾은선 ──────────
        if (attemptsRef.current) {
            chartsRef.current[3] = new Chart(attemptsRef.current, {
                type: 'line',
                data: {
                    labels: d.fillLevels,
                    datasets: [{
                        label: '평균 시도 횟수',
                        data: d.avgAttempts,
                        borderColor: GREEN.border,
                        backgroundColor: GREEN.bg,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 3,
                    }],
                },
                options: {
                    animation: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { title: { display: true, text: '기존 메시지 수 (화면 밀집도)' } },
                        y: { min: 1, title: { display: true, text: '평균 시도 횟수' } },
                    },
                },
            });
        }

        // 컴포넌트 언마운트 시 차트 정리
        return () => { chartsRef.current.forEach(c => c?.destroy()); };
    }, [params]);

    // 슬라이더 메타데이터 — 하드코딩 반복을 줄이기 위해 배열로 관리
    const sliders: { key: keyof SimParams; label: string; min: number; max: number; step: number }[] = [
        { key: 'msgCount', label: '화면 메시지 수',  min: 5,  max: 25,  step: 1  },
        { key: 'simCount', label: '시뮬레이션 횟수', min: 50, max: 500, step: 50 },
        { key: 'gap',      label: '최소 여백 (px)',  min: 0,  max: 40,  step: 5  },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <p className={styles.title}>배치 알고리즘 분석</p>
                <p className={styles.subtitle}>랜덤 배치 vs Poisson Disk Sampling 기반 배치 비교</p>
            </div>

            <div className={styles.controls}>
                {sliders.map(s => (
                    <div key={s.key} className={styles.sliderLabel}>
                        <span className={styles.sliderName}>{s.label}</span>
                        <div className={styles.sliderRow}>
                            <input
                                type="range"
                                min={s.min} max={s.max} step={s.step}
                                value={display[s.key]}
                                onChange={e => handleSlider(s.key, Number(e.target.value))}
                                className={styles.slider}
                            />
                            <span className={styles.sliderValue}>{display[s.key]}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.grid}>
                {[
                    { ref: scatterRef,  title: '공간 분포 시각화',             desc: '같은 수의 메시지를 배치했을 때의 위치 분포 차이' },
                    { ref: overlapRef,  title: '겹침 발생률 비교',             desc: '메시지 수가 늘어날수록 겹침이 얼마나 발생하는가' },
                    { ref: minDistRef,  title: '최소 거리 분포',               desc: '시뮬레이션별 메시지 간 최소 거리 분포 (클수록 여유있음)' },
                    { ref: attemptsRef, title: '배치 시도 횟수 vs 화면 밀집도', desc: '화면에 메시지가 많을수록 빈 자리 찾는 데 시도가 몇 번 필요한가' },
                ].map(card => (
                    <div key={card.title} className={styles.card}>
                        <p className={styles.cardTitle}>{card.title}</p>
                        <p className={styles.cardDesc}>{card.desc}</p>
                        <canvas ref={card.ref} />
                    </div>
                ))}
            </div>
        </div>
    );
}
