import type { Message } from '../types/message';
import { MESSAGE_SIZE } from './messageSize';

/** 한 번의 배치 시도 최대 횟수. 높을수록 빈 자리를 찾을 확률이 높아지지만 연산량 증가. */
const MAX_ATTEMPTS = 30;

/** 메시지 박스 사이에 강제로 확보하는 최소 여백 (px). 0이면 픽셀 단위로 딱 붙어도 허용. */
const MIN_GAP = 10;

interface Position {
    left: number; // vw 단위
    top: number;  // px 단위
}

interface Rect {
    x: number; // px
    y: number; // px
    w: number; // px
    h: number; // px
}

/**
 * vw/px 좌표와 메시지 타입을 받아 픽셀 기준 bounding box로 변환한다.
 * 충돌 감지는 모두 px 단위로 수행하므로 vw → px 변환이 필요하다.
 */
function toRect(left_vw: number, top_px: number, type: Message['type'], screenWidth: number): Rect {
    const { width, height } = MESSAGE_SIZE[type];
    return {
        x: (left_vw / 100) * screenWidth,
        y: top_px,
        w: width,
        h: height,
    };
}

/**
 * 두 Rect가 MIN_GAP 이상의 여백 없이 겹치는지 검사한다 (AABB 충돌 감지).
 * 두 박스 사이의 수평/수직 거리 중 하나라도 MIN_GAP 초과면 겹치지 않은 것으로 판단.
 */
function rectsOverlap(a: Rect, b: Rect): boolean {
    return !(
        a.x + a.w + MIN_GAP < b.x ||
        b.x + b.w + MIN_GAP < a.x ||
        a.y + a.h + MIN_GAP < b.y ||
        b.y + b.h + MIN_GAP < a.y
    );
}

/**
 * 두 Rect의 중심점 사이 유클리드 거리를 반환한다.
 * fallback 비교 시 "가장 덜 겹치는 후보"를 선택하는 기준으로 사용한다.
 */
function centerDistance(a: Rect, b: Rect): number {
    const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
    const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * sendModeType과 화면 조건에 따라 랜덤 후보 좌표를 생성한다.
 *
 * - mode 1: x 랜덤, y는 화면 하단 고정 (데스크탑) / 전체 랜덤 (모바일)
 * - mode 2: x=0 고정, y 랜덤 (왼쪽 흘러내리는 효과)
 * - mode 3: x, y 모두 랜덤 (기본 자유 배치)
 */
function generateCandidate(
    sendModeType: 1 | 2 | 3,
    maxLeft: number,
    screenHeight: number,
    topOffset: number,
    isMobile: boolean
): Position {
    const maxTop = screenHeight - topOffset;

    if (sendModeType === 1) {
        if (isMobile) return { left: Math.random() * maxLeft, top: Math.random() * maxTop };
        return { left: Math.random() * maxLeft, top: screenHeight - 36 };
    }
    if (sendModeType === 2) {
        if (isMobile) return { left: 0, top: 36 + Math.random() * (maxTop - 36) };
        return { left: 0, top: 36 + Math.random() * (screenHeight - 100 - 36) };
    }
    return { left: Math.random() * maxLeft, top: Math.random() * maxTop };
}

/**
 * Poisson Disk Sampling 아이디어를 실시간 단일 메시지 배치에 맞게 변형한 알고리즘.
 *
 * 동작 방식:
 *   1. MAX_ATTEMPTS 횟수만큼 랜덤 후보 좌표를 생성한다.
 *   2. 각 후보가 기존 메시지 전체와 충돌하지 않으면 즉시 반환한다 (O(n)).
 *   3. 모든 시도가 실패하면 기존 메시지들과 중심 거리가 가장 먼 후보를 반환한다 (fallback).
 *
 * @param existingMessages - 현재 화면에 표시 중인 메시지 목록
 * @param newType          - 새로 배치할 메시지의 타입 (크기 계산에 사용)
 * @param sendModeType     - 배치 방향 모드 (1: 하단, 2: 좌측, 3: 전체)
 * @param screenWidth      - 현재 화면 너비 (px)
 * @param screenHeight     - 현재 화면 높이 (px)
 * @param isMobile         - 모바일 여부 (배치 범위 계산에 영향)
 * @returns 겹치지 않는 { left(vw), top(px) } 좌표
 */
export function findPosition(
    existingMessages: Message[],
    newType: Message['type'],
    sendModeType: 1 | 2 | 3,
    screenWidth: number,
    screenHeight: number,
    isMobile: boolean
): Position {
    const maxLeft = isMobile ? 70 : 80;
    const topOffset = isMobile ? 250 : 100;

    // fallback으로 쓸 초기값 (첫 번째 후보로 초기화)
    let bestPos: Position = generateCandidate(sendModeType, maxLeft, screenHeight, topOffset, isMobile);
    let bestMinDist = -Infinity;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = generateCandidate(sendModeType, maxLeft, screenHeight, topOffset, isMobile);
        const candidateRect = toRect(candidate.left, candidate.top, newType, screenWidth);

        let hasOverlap = false;
        let minDist = Infinity;

        for (const msg of existingMessages) {
            const existingRect = toRect(msg.left, msg.top ?? 0, msg.type, screenWidth);
            if (rectsOverlap(candidateRect, existingRect)) hasOverlap = true;
            const d = centerDistance(candidateRect, existingRect);
            if (d < minDist) minDist = d;
        }

        // 기존 메시지 없으면 무조건 첫 후보 사용
        if (existingMessages.length === 0) minDist = Infinity;

        // 겹치지 않는 자리 발견 → 즉시 반환
        if (!hasOverlap) return candidate;

        // 겹치더라도 기존 메시지와 가장 멀리 떨어진 후보를 fallback으로 보관
        if (minDist > bestMinDist) {
            bestMinDist = minDist;
            bestPos = candidate;
        }
    }

    // MAX_ATTEMPTS 전부 실패 → 가장 덜 겹치는 위치로 배치
    return bestPos;
}
