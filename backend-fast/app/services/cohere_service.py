import os
import cohere
from typing import List, Dict, Any

class CohereService:
    def __init__(self):
        self.api_key = os.environ.get("COHERE_API_KEY") or os.environ.get("MODEL_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = cohere.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Erro ao inicializar Cohere Client: {e}")

    def consultar(self, consulta: str, documentos: List[Dict[str, Any]], idioma: str = "pt") -> Dict[str, Any]:
        """
        Envia a consulta ao Cohere usando as informações agregadas das antenas/tabelas como documentos (RAG).
        Retorna a resposta da IA e referências de fontes.
        """
        if not self.client:
            return {
                "resposta_ia": "Erro: Cohere API Key não configurada. Por favor, adicione a variável COHERE_API_KEY no arquivo .env.",
                "dados": [],
                "fontes": []
            }

        
        cohere_docs = []
        for doc in documentos:
           
            cohere_docs.append({
                "title": doc.get("title", "Sem título"),
                "snippet": doc.get("text", doc.get("snippet", "")),
                "text": doc.get("text", doc.get("snippet", ""))
            })


        prompt_sistema = (
            "Você é o BiT AI Assistant (Neural Engine), um agente inteligente de apoio à decisão "
            "para gestores públicos formularem políticas de inclusão digital e equidade social. "
            "Use apenas as informações fornecidas nos documentos associados para responder à pergunta. "
            "Seja extremamente preciso, cite números concretos, compare regiões se apropriado, e cite as fontes.\n"
            "Sempre que fizer referência aos dados de Angola, cite as respetivas fontes e inclua as URLs diretas listadas nos documentos "
            "(ex: INE Angola (https://www.ine.gov.ao/), INACOM (https://www.inacom.gov.ao/), OpenCelliD (https://opencellid.org/), "
            "OpenStreetMap (https://www.openstreetmap.org/) ou Banco Mundial (https://data.worldbank.org/country/angola)).\n"
            f"Por favor, responda no idioma solicitado: {idioma}."
        )

        try:
            
            response = self.client.chat(
                model="command-r-plus-08-2024",
                message=consulta,
                preamble=prompt_sistema,
                documents=cohere_docs
            )
            
            resposta_ia = response.text
            
            
            dados_retorno = []
            fontes = set()
            for doc in documentos:
                
                title = doc.get("title", "")
                text_content = doc.get("text", "")
                
               
                regiao = "Geral"
                if "—" in title:
                    regiao = title.split("—")[-1].strip()
                elif "de" in title:
                    regiao = title.split("de")[-1].strip()
                
                
                regiao = regiao.replace("(", "").replace(")", "").strip()
                
                
                fonte = "Vísent CDRView"
                if "Anatel" in text_content:
                    fonte = "Anatel / Vísent"
                elif "INE" in title or "INE" in text_content:
                    fonte = "INE Angola"
                elif "INACOM" in title or "INACOM" in text_content:
                    fonte = "INACOM"
                elif "OpenCelliD" in title or "OpenCelliD" in text_content:
                    fonte = "OpenCelliD"
                elif "OpenStreetMap" in title or "OpenStreetMap" in text_content or "OSM" in text_content:
                    fonte = "OpenStreetMap"
                elif "Banco Mundial" in title or "Banco Mundial" in text_content:
                    fonte = "Banco Mundial"
                fontes.add(fonte)
                
               
                import re
                usuarios_match = re.search(r"(\d+[\d.,]*)\s*usuários", text_content)
                valor = usuarios_match.group(1) if usuarios_match else "Ver detalhes no texto"
                
                dados_retorno.append({
                    "regiao": regiao,
                    "valor": valor,
                    "fonte": fonte
                })
            
            
            if not dados_retorno:
                dados_retorno = [{"regiao": "Florianópolis", "valor": "Dados agregados", "fonte": "Vísent CDRView"}]

            return {
                "resposta_ia": resposta_ia,
                "dados": dados_retorno[:5],
                "fontes": list(fontes) if fontes else ["Vísent CDRView"]
            }

        except Exception as e:
            print(f"Erro na chamada do Cohere: {e}")
            return {
                "resposta_ia": f"Lamentamos, mas ocorreu um erro ao contactar o agente inteligente: {str(e)}",
                "dados": [{"regiao": "Geral", "valor": "Erro na API", "fonte": "Erro"}],
                "fontes": []
            }
