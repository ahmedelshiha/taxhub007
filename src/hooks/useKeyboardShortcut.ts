"use client"

import { useEffect, useRef } from "react"
import { useKeyboard } from "@/components/providers/KeyboardProvider"

interface UseShortcutOptions {
    id: string
    combo: string
    description: string
    action: () => void
    disabled?: boolean
    deps?: any[]
}

export function useKeyboardShortcut({
    id,
    combo,
    description,
    action,
    disabled = false,
    deps = []
}: UseShortcutOptions) {
    const { registerShortcut, unregisterShortcut } = useKeyboard()

    // Use ref for action to handle stale closures without triggering effect
    const actionRef = useRef(action)
    useEffect(() => {
        actionRef.current = action
    }, [action])

    useEffect(() => {
        if (disabled) return

        registerShortcut({
            id,
            combo,
            description,
            action: () => actionRef.current(),
            disabled
        })

        return () => {
            unregisterShortcut(id)
        }
    }, [id, combo, description, disabled, registerShortcut, unregisterShortcut, ...deps])
}
