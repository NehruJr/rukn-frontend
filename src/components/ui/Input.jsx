import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    ...props
}, ref) => {
    const inputClasses = [
        styles.input,
        error && styles.error,
        leftIcon && styles.hasLeftIcon,
        rightIcon && styles.hasRightIcon,
        fullWidth && styles.fullWidth,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {props.required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={styles.inputContainer}>
                {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

                <input
                    ref={ref}
                    className={inputClasses}
                    {...props}
                />

                {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
            {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
