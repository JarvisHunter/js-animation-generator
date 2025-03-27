import ChatPage from "./ChatPage";
import styles from './styles_page.module.scss';
import Head from "next/head";

export default function Home() {
  return (
    <div className={styles.container}>
        <ChatPage />
    </div>
  );
}
