"use client"

import React, { useState, useRef, useEffect } from 'react'
import styles from './AppInputField.module.css'

export default function AppInputField({
  label = 'Label',
  placeholder = '',
  value: controlledValue,
  onChange,
  id,
  hideFloatingLabel = false,
  placeholderLeft = false,
  readOnly = false,
  editable = true,
  ...props
}) {
  const [focused, setFocused] = useState(false)
  const isControlled = controlledValue !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState('')
  const value = isControlled ? controlledValue : uncontrolledValue

  const showLabelTop = focused || (value && value.length > 0)
  const showPlaceholder = !focused && (!value || value.length === 0)

  const wrapperRef = useRef(null)

  // click-away: if user clicks outside and there's no value, remove focused state
  useEffect(() => {
    const handleDocMouseDown = (e) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target)) {
        if (!value || value.length === 0) {
          setFocused(false)
        }
      }
    }

    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [value])

  const handleChange = (e) => {
    if (!isControlled) setUncontrolledValue(e.target.value)
    if (onChange) onChange(e)
  }

  return (
    <div className={styles.fieldWrapper} ref={wrapperRef}>
      <div className={styles.inputContainer}>
        <label
          htmlFor={id}
          className={
            styles.label +
            (showLabelTop ? ` ${styles.labelTop}` : '') +
            (hideFloatingLabel ? ` ${styles.labelHidden}` : '')
          }
        >
          {label}
        </label>
        <input
          id={id}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onFocus={() => !readOnly && editable && setFocused(true)}
          readOnly={readOnly || !editable}
          style={{ 
            background: '#242627', 
            border: '0px solid #3a3b3c',
            cursor: (readOnly || !editable) ? 'default' : 'text',
            opacity: (readOnly || !editable) ? 0.7 : 1
          }}
          {...props}
        />
        <div
          className={
            styles.placeholder +
            (showPlaceholder ? '' : ` ${styles.placeholderHidden}`) +
            (placeholderLeft ? ` ${styles.placeholderLeft}` : '')
          }
        >
          {placeholder}
        </div>
      </div>
    </div>
  )
}
