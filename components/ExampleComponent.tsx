// components/ExampleComponent.tsx
import styles from './.module.css'
import { getFontClass } from '@/lib/fonts'

export default function ExampleComponent() {
  return (
    <div className={styles.container}>
      {/* Using CSS modules directly */}
      <h1 className={styles.h1}>Heading 1</h1>
      <p className={styles.body}>Body text</p>
      
      {/* Using font utility function */}
      <button className={`${styles.btn} ${getFontClass('button')}`}>
        Button
      </button>
      
      {/* Using font utility classes */}
      <div className="fontSans fontSemibold trackingWide">
        Utility class example
      </div>
    </div>
  )
}

