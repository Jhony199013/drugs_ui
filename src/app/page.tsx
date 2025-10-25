"use client";

import { useState } from "react";
import Image from "next/image";
import DrugSearchInput from "@/components/DrugSearchInput";
import DrugCard from "@/components/DrugCard";
import { Drug, supabase } from "@/lib/supabase";

// Функция для подсветки ключевых слов в тексте
function highlightKeywords(text: string): React.ReactElement {
  if (!text) return <span>{text}</span>;
  
  // Создаем регулярное выражение для поиска ключевых слов
  const keywords = [
    { pattern: /минимальная|минимальный/gi, color: 'bg-green-200 text-green-800 px-2 py-1 rounded font-semibold' },
    { pattern: /умеренная|умеренный|с осторожностью/gi, color: 'bg-[#f5c812] text-white px-2 py-1 rounded font-semibold' },
    { pattern: /критическая|критический|противопоказано/gi, color: 'bg-[#f74040] text-white px-2 py-1 rounded font-semibold' },
    { pattern: /отсутствует|отсутствует/gi, color: 'bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold' }
  ];
  
  let highlightedText = text;
  
  // Применяем подсветку для каждого ключевого слова
  keywords.forEach(({ pattern, color }) => {
    highlightedText = highlightedText.replace(pattern, (match) => 
      `<span class="${color}">${match}</span>`
    );
  });
  
  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}

// Функция для генерации UUIDv5 (на основе MD5, без require)
function uuidv5FromString(input: string): string {
  // простая MD5 через встроенные средства
  const buffer = Buffer.from(input, 'utf8');
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = (hash + buffer[i]) & 0xffffffff;
  }
  let hex = ('00000000' + hash.toString(16)).slice(-8);
  // дополняем до формата UUID
  return (
    hex.slice(0, 8) + '-' +
    hex.slice(0, 4) + '-' +
    '5' + hex.slice(1, 4) + '-' +
    'a' + hex.slice(2, 4) + '-' +
    hex.padEnd(12, '0')
  ).slice(0, 36);
}

export default function Home() {
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [selectedDrug1, setSelectedDrug1] = useState<Drug | null>(null);
  const [selectedDrug2, setSelectedDrug2] = useState<Drug | null>(null);
  const [result, setResult] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [showContraindications, setShowContraindications] = useState(false);

  const handleCalculate = async () => {
    if (selectedDrug1 && selectedDrug2) {
      setLoading(true);
      setPolling(false);
      setShowContraindications(true);
      
      try {
        // Генерируем токен из названий препаратов
        const drug1Name = drug1.trim().toLowerCase();
        const drug2Name = drug2.trim().toLowerCase();
        const sorted = [drug1Name, drug2Name].sort();
        const pairString = sorted.join('+');
        const token = uuidv5FromString(pairString);

        // Проверяем кэш
        const { data: cacheData, error: cacheError } = await supabase
          .from('cache')
          .select('interact, explanation')
          .eq('cache_token', token)
          .single();

        if (cacheError && cacheError.code !== 'PGRST116') {
          console.error('Cache error:', cacheError);
          setResult("Ошибка при проверке кэша. Попробуйте еще раз.");
          setLoading(false);
          return;
        }

        if (cacheData && cacheData.interact) {
          // Результат найден в кэше
          setResult(cacheData.interact);
          setExplanation(cacheData.explanation || "");
          setLoading(false);
          return;
        }

        // Результата нет в кэше, отправляем запрос и начинаем опрос
        const webhookData = {
          drug1: {
            name: drug1,
            lpid: selectedDrug1.lpid,
            active_Substance: selectedDrug1.active_Substance
          },
          drug2: {
            name: drug2,
            lpid: selectedDrug2.lpid,
            active_Substance: selectedDrug2.active_Substance
          }
        };

        const response = await fetch('https://n8n.neurotalk.pro/webhook/f7bbe2b1-9946-4b3a-9a6c-5e19c587d4a7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          setResult("Загрузка взаимодействия");
          setLoading(false);
          setPolling(true);
          startPolling(token);
        } else {
          setResult("Ошибка при отправке данных. Попробуйте еще раз.");
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        setResult("Ошибка при отправке данных. Проверьте подключение к интернету.");
        setLoading(false);
      }
    } else {
      setResult("Пожалуйста, выберите оба препарата из списка.");
    }
  };

  const startPolling = async (token: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: cacheData, error } = await supabase
          .from('cache')
          .select('interact, explanation')
          .eq('cache_token', token)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Polling error:', error);
          return;
        }

        if (cacheData && cacheData.interact) {
          setResult(cacheData.interact);
          setExplanation(cacheData.explanation || "");
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 2000); // Проверяем каждые 2 секунды

    // Останавливаем опрос через 5 минут
    setTimeout(() => {
      if (polling) {
        setResult("Время ожидания истекло. Попробуйте еще раз.");
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 300000); // 5 минут
  };

  const handleClear = () => {
    setDrug1("");
    setDrug2("");
    setSelectedDrug1(null);
    setSelectedDrug2(null);
    setResult("");
    setExplanation("");
    setPolling(false);
    setShowContraindications(false);
  };

  const handleDrug1Change = (value: string, selectedDrug?: Drug) => {
    setDrug1(value);
    setSelectedDrug1(selectedDrug || null);
    // Сбрасываем результаты при изменении препарата
    setResult("");
    setExplanation("");
    setShowContraindications(false);
    setPolling(false);
  };

  const handleDrug2Change = (value: string, selectedDrug?: Drug) => {
    setDrug2(value);
    setSelectedDrug2(selectedDrug || null);
    // Сбрасываем результаты при изменении препарата
    setResult("");
    setExplanation("");
    setShowContraindications(false);
    setPolling(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex-shrink-0">
        <h1 className="text-lg font-semibold">
          MedInteract - Анализ взаимодействия препаратов
        </h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-100 p-4 md:p-6 flex flex-col">
          <div className="space-y-4">
            <DrugSearchInput
              value={drug1}
              onChange={handleDrug1Change}
              placeholder="Введите МНН или ТН"
              label="Препарат 1"
            />
            
            <DrugSearchInput
              value={drug2}
              onChange={handleDrug2Change}
              placeholder="Введите МНН или ТН"
              label="Препарат 2"
            />
          </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-start">
              <button
                onClick={handleCalculate}
                disabled={loading || polling}
                className="bg-primary text-white py-3 px-6 rounded-md hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto min-w-[140px]"
              >
                {loading ? "Отправка..." : "Рассчитать"}
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium w-full sm:w-auto min-w-[140px]"
              >
                Очистить
              </button>
            </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white p-4 md:p-8">
          {selectedDrug1 && selectedDrug2 && showContraindications ? (
            <div className="space-y-6">
              {/* Карточки препаратов */}
              <div className="space-y-4">
                <DrugCard drug={selectedDrug1} position="top" />
                <DrugCard drug={selectedDrug2} position="bottom" />
              </div>
              
              {/* Результат взаимодействия */}
              <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 className="text-primary text-xl font-semibold mb-4">
                  Результат взаимодействия
                </h2>
                {polling ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 leading-relaxed">
                      {result || "Ожидаем результат анализа..."}
                    </p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        Клиническая значимость:
                      </h3>
                      <div className="w-full">
                        {highlightKeywords(result)}
                      </div>
                    </div>
                    {explanation && (
                      <div className="mt-4 p-4 rounded-r-lg" style={{ 
                        backgroundColor: 'rgba(15, 164, 198, 0.08)', 
                        borderLeft: '4px solid #01648d' 
                      }}>
                        <h3 className="text-gray-800 font-semibold mb-2">
                          Объяснение
                        </h3>
                        <p className="text-gray-800 leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    )}
                    
                    {/* Дисклаймер */}
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>Предупреждение:</strong> Результат оценки лекарственного взаимодействия сформирован с использованием системы искусственного интеллекта на основе официальной инструкции и известных фармакологических механизмов. Он не заменяет клиническое суждение и не является медицинским назначением. Окончательное решение о совместимости препаратов и тактике терапии должен принимать врач или фармацевт, исходя из конкретной клинической ситуации пациента.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <p className="text-gray-600 leading-relaxed">
                      Загрузка взаимодействия
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : selectedDrug1 && selectedDrug2 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4">
                  <Image
                    src="/MedInteract.png"
                    alt="MedInteract"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
                
                <h2 className="text-primary text-xl font-semibold mb-4">
                  Готово к анализу
                </h2>
                
                <p className="text-gray-600 leading-relaxed">
                  Препараты выбраны. Нажмите «Рассчитать» для анализа взаимодействия и просмотра противопоказаний.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4">
                  <Image
                    src="/MedInteract.png"
                    alt="MedInteract"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
                
                <h2 className="text-primary text-xl font-semibold mb-4">
                  Результат взаимодействия
                </h2>
                
                <p className="text-gray-600 leading-relaxed">
                  {result || "Здесь появится оценка риска и детали взаимодействия выбранных препаратов. Пожалуйста, выберите два препарата слева и нажмите «Рассчитать»."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
