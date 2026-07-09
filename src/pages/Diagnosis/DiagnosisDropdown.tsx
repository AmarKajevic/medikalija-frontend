import { useEffect, useState } from "react";
import axios from "axios";
import Select from 'react-select';

interface DiagnosisTemplate {
  _id: string;
  name: string;
  description?: string;
}

interface Props {
  onSelect: (templateId: string) => void;
}

export default function DiagnosisDropdown({ onSelect }: Props) {
  const [templates, setTemplates] = useState<DiagnosisTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/diagnosisTemplate", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setTemplates(response.data.diagnosisTemplates || []);
        }
      } catch (err) {
        console.error(err);
        setError("Greška pri učitavanju šablona dijagnoza");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [token]);
  

  if (error) return <p className="text-red-500">{error}</p>;
  
    const options = templates.map(t => ({
    value: t._id,
    label: (
        <div>
        <strong>{t.name}</strong>
        <div style={{ fontSize: '0.8em', color: '#555'}}>{t.description}</div>
        </div>
    )
    }));
  return (
    
    <Select
  options={options}
  onChange={(selectedOption) => onSelect(selectedOption?.value  || "")}
  isDisabled={loading || templates.length === 0}
/>
  );
}
