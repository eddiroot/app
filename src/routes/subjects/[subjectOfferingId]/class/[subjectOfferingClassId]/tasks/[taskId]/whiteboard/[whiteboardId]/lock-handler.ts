// Lock handler for whiteboard
export function applyLockState(canvas: any, locked: boolean, isTeacher: boolean) {
	if (!canvas) return

	if (locked && !isTeacher) {
		// Student in locked mode - view only
		canvas.isDrawingMode = false
		canvas.selection = false
		canvas.forEachObject((obj: any) => {
			obj.selectable = false
			obj.evented = false
		})
		canvas.discardActiveObject()
		canvas.renderAll()
	} else {
		// Teacher or unlocked - normal mode
		canvas.selection = true
		canvas.forEachObject((obj: any) => {
			obj.selectable = true
			obj.evented = true
		})
		canvas.renderAll()
	}
}

export function handleLockMessage(
	data: any,
	isLocked: { value: boolean },
	canvas: any,
	isTeacher: boolean,
	applyLock: typeof applyLockState
) {
	if (data.type === 'lock' || data.type === 'unlock') {
		isLocked.value = data.isLocked
		applyLock(canvas, isLocked.value, isTeacher)
	}
}
