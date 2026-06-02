import styles from './styles.module.scss';
import { useState, useEffect } from "react";
import axios from "axios";

interface Gif {
    id: string;
    url: string;
    title: string;
}

interface KlipyGifSearchProps {
    apiKey: string;
    onSelectGif: (gifUrl: string) => void;
}

export default function GifSearch({ apiKey, onSelectGif }: KlipyGifSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [gifs, setGifs] = useState<Gif[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setGifs([]);
            setErrorMsg(null);
            return;
        }

        const source = axios.CancelToken.source();

        const debounceTimeout = setTimeout(() => {
            setIsLoading(true);
            setErrorMsg(null);
            axios.get(`https://api.klipy.com/api/v1/${apiKey}/gifs/search`, {
                params: {
                    q: searchTerm,
                    per_page: 25,
                },
                cancelToken: source.token,
            })
                .then(response => {
                    if (
                        response.data &&
                        response.data.data &&
                        Array.isArray(response.data.data.data)
                    ) {
                        const gifs = response.data.data.data
                            .map((item: any) => ({
                                id: item.id,
                                url: item.file?.hd?.gif?.url || '',
                                title: item.title,
                            }))
                            .filter((gif: Gif) => gif.url !== '');
                        setGifs(gifs);
                        if (gifs.length === 0) setErrorMsg('검색 결과가 없습니다.');
                    } else {
                        setGifs([]);
                        setErrorMsg('검색 결과가 없습니다.');
                    }
                })
                .catch(error => {
                    if (!axios.isCancel(error)) {
                        setErrorMsg('검색 중 오류가 발생했습니다.');
                        setGifs([]);
                    }
                })
                .finally(() => setIsLoading(false));
        }, 400);

        return () => {
            clearTimeout(debounceTimeout);
            source.cancel('Operation canceled by the user.');
        };
    }, [searchTerm, apiKey]);

    return (
        <div className={styles.container}>
            <span className={styles.title}>Search GIFs</span>

            <input
                type="text"
                placeholder="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.input}
            />

            {isLoading && <div className={styles.statusMessage}>로딩 중...</div>}
            {errorMsg && !isLoading && <div className={styles.statusMessage}>{errorMsg}</div>}

            <div className={styles.gifScrollBox}>
                <div className={styles.gifGrid}>
                    {gifs.map(gif => (
                        <img
                            key={gif.id}
                            src={gif.url}
                            alt={gif.title}
                            className={styles.gifThumb}
                            onClick={() => onSelectGif(gif.url)}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
