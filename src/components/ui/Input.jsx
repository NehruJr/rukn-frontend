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

    // Force LTR layout for password fields so entered characters don't reverse
    const isPasswordField = props.type === 'password' || props.name === 'password';
    const forcedDir = isPasswordField ? 'ltr' : undefined;
    const forcedLang = isPasswordField ? 'en' : undefined;

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
                    className={
                        isPasswordField ? `${inputClasses} ${styles.forceLTR}` : inputClasses
                    }
                    dir={props.dir ?? forcedDir}
                    lang={props.lang ?? forcedLang}
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
