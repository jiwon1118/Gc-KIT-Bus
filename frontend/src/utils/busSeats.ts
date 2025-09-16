export interface Seat {
  id: string
  row: number
  col: number
  status: 'available' | 'occupied' | 'selected'
}

export type BusType = '28-seat' | '45-seat'

export function generateBusSeats(busType: BusType = '28-seat'): Seat[] {
  const seats: Seat[] = []
  const colLabels = ['A', 'B', 'C', 'D']

  if (busType === '28-seat') {
    // 28인승 버스: 2-1 배열 (9열까지, 마지막 9열은 4명)
    for (let row = 1; row <= 9; row++) {
      if (row === 9) {
        // 9열: 4명 좌석 (통로에도 좌석 배치)
        seats.push({ id: `${row}A`, row, col: 1, status: 'available' })
        seats.push({ id: `${row}B`, row, col: 2, status: 'available' })
        seats.push({ id: `${row}C`, row, col: 3, status: 'available' }) // 통로 좌석
        seats.push({ id: `${row}D`, row, col: 4, status: 'available' })
      } else {
        // 1-8열: 일반 2-1 배치
        seats.push({ id: `${row}A`, row, col: 1, status: 'available' })
        seats.push({ id: `${row}B`, row, col: 2, status: 'available' })
        // 통로 (col 3은 비움)
        // 오른쪽 1석
        seats.push({ id: `${row}C`, row, col: 4, status: 'available' })
      }

      if (seats.length >= 28) break
    }
    return seats.slice(0, 28)
  } else {
    // 45인승 버스: 2-2 배열 (11열까지, 마지막 11열은 5연석)
    for (let row = 1; row <= 11; row++) {
      if (row === 11) {
        // 11열: 5연석 (통로 없이 연속 배치)
        seats.push({ id: `${row}A`, row, col: 1, status: 'available' })
        seats.push({ id: `${row}B`, row, col: 2, status: 'available' })
        seats.push({ id: `${row}C`, row, col: 3, status: 'available' })
        seats.push({ id: `${row}D`, row, col: 4, status: 'available' })
        seats.push({ id: `${row}E`, row, col: 5, status: 'available' })
      } else {
        // 1-10열: 일반 2-2 배치
        seats.push({ id: `${row}A`, row, col: 1, status: 'available' })
        seats.push({ id: `${row}B`, row, col: 2, status: 'available' })
        // 통로 (col 3은 비움)
        seats.push({ id: `${row}C`, row, col: 4, status: 'available' })
        seats.push({ id: `${row}D`, row, col: 5, status: 'available' })
      }

      if (seats.length >= 45) break
    }
    return seats.slice(0, 45)
  }
}