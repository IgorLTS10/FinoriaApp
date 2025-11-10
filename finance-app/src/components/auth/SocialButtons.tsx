import { stackClientApp } from "../../auth/stack";
import styles from "./SocialButtons.module.css";

export default function SocialButtons() {
  return (
    <div className={styles.socialWrap}>
      <button
        className={`${styles.socialBtn} ${styles.github}`}
        onClick={() => stackClientApp.signInWithOAuth("github")}   // 👈 string, pas object
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.45-1.1-1.45-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.9.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.7.12 2.5.35 1.9-1.29 2.74-1.02 2.74-1.02.56 1.38.21 2.4.1 2.65.64.7 1.02 1.59 1.02 2.68 0 3.85-2.34 4.7-4.57 4.94.36.31.68.93.68 1.88v2.79c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
          />
        </svg>
        <span>Continuer avec GitHub</span>
      </button>

      <button
        className={`${styles.socialBtn} ${styles.google}`}
        onClick={() => stackClientApp.signInWithOAuth("google")}   // 👈 string, pas object
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.22 1.33-1.54 3.9-5.1 3.9-3.06 0-5.56-2.53-5.56-5.7S8.94 6.3 12 6.3c1.75 0 2.93.73 3.6 1.36l2.45-2.37C16.69 3.5 14.51 2.7 12 2.7 6.98 2.7 3 6.67 3 11.7s3.98 9 9 9c5.2 0 8.64-3.66 8.64-8.82 0-.59-.06-1.04-.14-1.48H12z"
          />
        </svg>
        <span>Continuer avec Google</span>
      </button>
    </div>
  );
}
