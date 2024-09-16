import { useEffect } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

const withAuth = (WrappedComponent: any) => {
    return (props: any) => {
        const router = useRouter();
        
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if(!user) {
                    router.push('/login');
                }
        });

            return () => unsubscribe();
        }, []);

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;