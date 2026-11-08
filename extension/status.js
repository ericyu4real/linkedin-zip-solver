export function statusView(info) {
  if (!info || info.error === 'timeout') {
    return {
      visible: false,
      title: 'No Zip board on this page.',
      detail: 'Open LinkedIn Zip and start the game first.',
      actionEnabled: false,
      actionLabel: 'Solve',
      tone: 'idle',
    };
  }
  if (info.completed || info.solved) {
    return {
      visible: true,
      title: info.n ? `${info.n}×${info.n} Zip solved` : 'Board solved',
      detail: 'LinkedIn should now show the completed puzzle.',
      actionEnabled: false,
      actionLabel: 'Solve',
      tone: 'solved',
    };
  }
  if (info.hasBoard) {
    return {
      visible: true,
      title: `Found ${info.n}×${info.n} Zip`,
      detail: 'Click Solve to draw the path.',
      actionEnabled: true,
      actionLabel: 'Solve',
      tone: 'ready',
    };
  }
  if (info.identified) {
    return {
      visible: true,
      title: 'Zip is open',
      detail: 'Start the game so the numbered grid is visible.',
      actionEnabled: false,
      actionLabel: 'Solve',
      tone: 'waiting',
    };
  }
  return {
    visible: false,
    title: 'This is not a Zip game.',
    detail: 'Go to LinkedIn Zip, then click the extension again.',
    actionEnabled: false,
    actionLabel: 'Solve',
    tone: 'idle',
  };
}

export function fillingView(n) {
  return {
    visible: true,
    title: n ? `Solving ${n}×${n} Zip…` : 'Solving Zip…',
    detail: 'Drawing the path and checking the board after each cell.',
    actionEnabled: false,
    actionLabel: 'Solving…',
    tone: 'filling',
  };
}

export function filledView(n) {
  return {
    visible: true,
    title: n ? `Solved ${n}×${n} Zip` : 'Solved Zip',
    detail: 'LinkedIn should now show the completed puzzle.',
    actionEnabled: false,
    actionLabel: 'Solve',
    tone: 'solved',
  };
}

export function failedView(error) {
  return {
    visible: true,
    title: 'Could not solve this board.',
    detail: error ? String(error) : 'Try starting the game again, then click Solve.',
    actionEnabled: true,
    actionLabel: 'Solve',
    tone: 'error',
  };
}
