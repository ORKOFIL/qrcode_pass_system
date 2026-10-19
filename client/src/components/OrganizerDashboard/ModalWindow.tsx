import type { ModalWindowProps } from '../../types'
import { ShieldCheck } from 'lucide-react';

export default function ModalWindow({setModalItem, tempFullName, setTempFullName, savePassportData, modalItem}:ModalWindowProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black w-full max-w-md p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-black pb-4">
                    <h3 className="text-sm font-mono uppercase tracking-wider flex items-center space-x-2 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Паспортні дані відвідувача</span>
                    </h3>
                    <button onClick={() => setModalItem(null)} className="text-xs font-mono uppercase border border-black px-2 py-1 hover:bg-black hover:text-white transition cursor-pointer">
                        [Х]
                    </button>
                </div>

                <div className="space-y-4 font-mono text-xs">
                    <p className="text-neutral-600">
                        Код квитка: <span className="text-black font-bold">{modalItem.id}</span>. Введіть дані суворо за документами:
                    </p>
                    <div>
                        <label className="block uppercase mb-1 font-bold">ПІБ</label>
                        <input
                            type="text"
                            placeholder="Наприклад: Наконечний Орест Андрійович"
                            value={tempFullName}
                            onChange={(e) => setTempFullName(e.target.value)}
                            className="w-full border border-black px-3 py-2.5 text-xs font-sans focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-black">
                    <button
                        onClick={() => setModalItem(null)}
                        className="px-4 py-2 border border-black text-xs uppercase font-mono hover:bg-neutral-100 transition cursor-pointer"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={savePassportData}
                        className="px-5 py-2 bg-black text-white text-xs uppercase font-mono tracking-wider hover:bg-neutral-800 transition cursor-pointer font-bold"
                    >
                        Зберегти в БД
                    </button>
                </div>
            </div>
        </div>
    )
}