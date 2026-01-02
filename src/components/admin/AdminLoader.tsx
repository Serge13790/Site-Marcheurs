import { Mountain } from 'lucide-react'

export function AdminLoader() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-slate-400 animate-in fade-in duration-300">
            <div className="relative mb-4">
                <Mountain className="w-12 h-12 text-blue-200 dark:text-blue-900/30 absolute blur-sm animate-pulse" />
                <Mountain className="w-12 h-12 text-blue-600 dark:text-blue-500 animate-[spin_3s_linear_infinite]" />
            </div>
            <p className="text-sm font-medium tracking-wide uppercase opacity-70">Chargement</p>
        </div>
    )
}
