import { greetingFor } from './greeting'

const at = (h: number, m: number) => new Date(2026, 10, 18, h, m)

describe('greetingFor', () => {
  it('greets in the morning at 11:59', () => {
    expect(greetingFor('Asha', at(11, 59))).toBe('Good morning, Asha')
  })
  it('greets in the afternoon at 12:00', () => {
    expect(greetingFor('Asha', at(12, 0))).toBe('Good afternoon, Asha')
  })
  it('greets in the afternoon at 16:59', () => {
    expect(greetingFor('Asha', at(16, 59))).toBe('Good afternoon, Asha')
  })
  it('greets in the evening at 17:00', () => {
    expect(greetingFor('Asha', at(17, 0))).toBe('Good evening, Asha')
  })
})
