import { findAvailableSlots } from "./solution";

test("basic example", () => {
  const interviewerBusy: [number, number][] = [
    [9, 10],
    [12, 13],
    [16, 18],
  ];
  const candidateBusy: [number, number][] = [
    [10, 11],
    [13, 15],
  ];
  expect(findAvailableSlots(interviewerBusy, candidateBusy, 9, 18, 1)).toEqual([
    [11, 12],
    [15, 16],
  ]);
});

test("unsorted inputs", () => {
  const interviewerBusy: [number, number][] = [
    [16, 18],
    [9, 10],
    [12, 13],
  ];
  const candidateBusy: [number, number][] = [
    [13, 15],
    [10, 11],
  ];
  expect(findAvailableSlots(interviewerBusy, candidateBusy, 9, 18, 1)).toEqual([
    [11, 12],
    [15, 16],
  ]);
});

test("no available slots", () => {
  expect(findAvailableSlots([[9, 18]], [], 9, 18, 1)).toEqual([]);
});

// TODO: add a test where duration is longer than any free gap
// TODO: add a test where both participants are fully free all day
