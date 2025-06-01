'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallBack(){
    const router = useRouter()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try{
                const {data, error} = await supabase.auth.getSession();

                if(error){
                    throw error;
                }

                if(data.session){
                    toast.success('Successfully signed in!')
                    router.push('/')
                }else{
                    router.push('/auth')
                }
            }catch(error: any){
                toast.error('Authentication failed: ' + error.message)
                router.push('/auth')
            }
        }

        handleAuthCallback();
    }, [router])

    return(
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-semibold">Completing sign in...</h2>
                <p className=" text-muted-foreground">Please wait while we redirect you.</p>
            </div>
        </div>
    )
}