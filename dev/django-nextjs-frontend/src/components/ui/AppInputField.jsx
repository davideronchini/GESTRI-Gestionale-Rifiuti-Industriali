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

  const showLabelTop = false // Disabilita il movimento del label
  const showPlaceholder = !focused && (!value || value.length === 0)

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const [lastTouchTime, setLastTouchTime] = useState(0)
  const [isDoubleClick, setIsDoubleClick] = useState(false)

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

  // Funzione per selezionare tutto il testo
  const selectAllText = () => {
    if (inputRef.current && editable && !readOnly) {
      // Assicurati che l'input abbia il focus
      inputRef.current.focus()
      // Usa setTimeout per assicurarsi che la selezione avvenga dopo il focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, inputRef.current.value.length)
        }
      }, 0)
    }
  }

  // Funzione per gestire il click singolo
  const handleClick = (e) => {
    // Se è un doppio click, non eseguire la funzione onClick
    if (isDoubleClick) {
      setIsDoubleClick(false)
      return
    }

    // Usa un piccolo delay per controllare se arriva un doppio click
    setTimeout(() => {
      if (!isDoubleClick && props.onClick) {
        props.onClick(e)
      }
    }, 200)
  }

  // Funzione per gestire il doppio click (desktop)
  const handleDoubleClick = (e) => {
    e.preventDefault()
    setIsDoubleClick(true)
    selectAllText()
    
    // Reset del flag dopo un breve delay
    setTimeout(() => {
      setIsDoubleClick(false)
    }, 300)
  }

  // Funzione per gestire il doppio tap (mobile)
  const handleTouchStart = (e) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTouchTime
    
    // Se il doppio tap avviene entro 300ms, seleziona tutto il testo
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault()
      setIsDoubleClick(true)
      selectAllText()
      
      // Reset del flag dopo un breve delay
      setTimeout(() => {
        setIsDoubleClick(false)
      }, 300)
    }
    
    setLastTouchTime(currentTime)
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
          ref={inputRef}
          id={id}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onFocus={() => !readOnly && editable && setFocused(true)}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          readOnly={readOnly || !editable}
          style={{ 
            background: '#242627', 
            border: '0px solid #3a3b3c',
            cursor: (readOnly || !editable) ? 'default' : 'text',
            opacity: (readOnly || !editable) ? 1 : 1,
            touchAction: 'manipulation' // Migliora la responsività su mobile
          }}
          {...(props.onClick ? {} : props)} // Escludi onClick se viene passato, sarà gestito da handleClick
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
