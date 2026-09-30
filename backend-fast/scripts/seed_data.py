#!/usr/bin/env python3
import os
import sys
import csv
import argparse
from datetime import datetime
from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.antena import Antena
from app.models.assinantes import Assinante
from app.models.tensor_concentracao import TensorConcentracao
from app.models.tensor_fluxo_vias import TensorFluxoVias
from app.models.tensor_od import TensorOD
from app.models.tensor_tempo_deslocamento import TensorTempoDeslocamento
from app.models.trajetos_comuns import TrajetosComuns


def to_int(val):
    if val is None or val.strip() == "":
        return None
    try:
        return int(float(val))
    except ValueError:
        return None

def to_float(val):
    if val is None or val.strip() == "":
        return None
    try:
        return float(val)
    except ValueError:
        return None

def to_date(val):
    if val is None or val.strip() == "":
        return None
    try:
        return datetime.strptime(val.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None

def to_str(val):
    if val is None:
        return None
    return val.strip()


def clear_table(session, model):
    try:
        if "postgresql" in str(session.bind.url):
            session.execute(text(f'TRUNCATE TABLE "{model.__tablename__}" CASCADE;'))
        else:
            session.query(model).delete()
        session.commit()
        print(f" Tabela '{model.__tablename__}' limpa com sucesso.")
    except Exception as e:
        session.rollback()
        print(f" Erro ao limpar tabela '{model.__tablename__}': {e}")

# Seed functions
def seed_antenas(session, filepath):
    print(f"Antenas a partir de {filepath}...")
    clear_table(session, Antena)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ecgi_str = to_str(row.get("ecgi"))
            tecnologia = to_str(row.get("tecnologia"))
            
            if not tecnologia and ecgi_str:
                try:
                    ecgi_val = int(ecgi_str)
                except ValueError:
                    ecgi_val = 0
                mod = ecgi_val % 10
                if mod in (0, 1):
                    tecnologia = "5G"
                elif mod == 2:
                    tecnologia = "3G"
                else:
                    tecnologia = "4G"

            antena = Antena(
                ecgi=ecgi_str,
                municipio=to_str(row.get("municipio")),
                cluster=to_str(row.get("cluster")),
                lat=to_float(row.get("lat")),
                lon=to_float(row.get("lon")),
                tecnologia=tecnologia,
                nome=to_str(row.get("nome") or f"ERB_{ecgi_str[-4:] if ecgi_str else ''}")
            )
            batch.append(antena)
            count += 1
            if len(batch) >= 1000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'antenas'.")

def seed_assinantes(session, filepath):
    print(f" Assinantes a partir de {filepath}...")
    clear_table(session, Assinante)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            assinante = Assinante(
                assinante_hash=to_int(row.get("assinante_hash")),
                home_cluster=to_str(row.get("home_cluster")),
                home_municipio=to_str(row.get("home_municipio")),
                income_cluster=to_str(row.get("income_cluster")),
                age_group=to_str(row.get("age_group")),
                mobility_pattern=to_str(row.get("mobility_pattern")),
                flag_flagship=to_int(row.get("flag_flagship"))
            )
            batch.append(assinante)
            count += 1
            if len(batch) >= 2000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'assinantes'.")

def seed_tensor_concentracao(session, filepath):
    print(f"Semeando Tensor Concentracao a partir de {filepath}...")
    clear_table(session, TensorConcentracao)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tc = TensorConcentracao(
                ecgi=to_str(row.get("ecgi")),
                cluster=to_str(row.get("cluster")),
                municipio=to_str(row.get("municipio")),
                dia=to_date(row.get("day_date")),
                periodo=to_str(row.get("periodo")),
                n_usuarios=to_int(row.get("n_usuarios")),
                n_sessoes=to_int(row.get("n_sessoes")),
                download_bytes=to_int(row.get("download_bytes")),
                upload_bytes=to_int(row.get("upload_bytes")),
                dur_media_s=to_float(row.get("dur_media_s")),
                drop_pct_medio=to_float(row.get("drop_pct_medio")),
                congestionamento_medio=to_float(row.get("congestionamento_medio")),
                chamadas_total=to_int(row.get("chamadas_total")),
                mensagens_total=to_int(row.get("mensagens_total")),
                lat=to_float(row.get("lat")),
                lon=to_float(row.get("lon"))
            )
            batch.append(tc)
            count += 1
            if len(batch) >= 2000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'tensor_concentracao'.")

def seed_tensor_fluxo_vias(session, filepath):
    print(f"Semeando Tensor Fluxo Vias a partir de {filepath}...")
    clear_table(session, TensorFluxoVias)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tfv = TensorFluxoVias(
                ecgi_origem=to_str(row.get("ecgi_origem")),
                lat_origem=to_float(row.get("lat_origem")),
                lon_origem=to_float(row.get("lon_origem")),
                cluster_origem=to_str(row.get("cluster_origem")),
                municipio_origem=to_str(row.get("municipio_origem")),
                ecgi_destino=to_str(row.get("ecgi_destino")),
                lat_destino=to_float(row.get("lat_destino")),
                lon_destino=to_float(row.get("lon_destino")),
                cluster_destino=to_str(row.get("cluster_destino")),
                municipio_destino=to_str(row.get("municipio_destino")),
                n_usuarios=to_int(row.get("n_usuarios")),
                n_transicoes=to_int(row.get("n_transicoes")),
                dist_km=to_float(row.get("dist_km")),
                periodo_predominante=to_str(row.get("periodo_predominante")),
                pct_do_cluster_origem=to_float(row.get("pct_do_cluster_origem"))
            )
            batch.append(tfv)
            count += 1
            if len(batch) >= 2000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'tensor_fluxo_vias'.")

def seed_tensor_od(session, filepath):
    print(f" Semeando Tensor OD a partir de {filepath}...")
    clear_table(session, TensorOD)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tod = TensorOD(
                cluster_origem=to_str(row.get("cluster_origem")),
                municipio_origem=to_str(row.get("municipio_origem")),
                lat_origem=to_float(row.get("lat_origem")),
                lon_origem=to_float(row.get("lon_origem")),
                cluster_destino=to_str(row.get("cluster_destino")),
                municipio_destino=to_str(row.get("municipio_destino")),
                lat_destino=to_float(row.get("lat_destino")),
                lon_destino=to_float(row.get("lon_destino")),
                mesmo_cluster=to_int(row.get("mesmo_cluster")),
                n_usuarios=to_int(row.get("n_usuarios")),
                n_viagens=to_int(row.get("n_viagens")),
                dist_media_km=to_float(row.get("dist_media_km")),
                periodo_predominante=to_str(row.get("periodo_predominante"))
            )
            batch.append(tod)
            count += 1
            if len(batch) >= 1000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'tensor_od'.")

def seed_tensor_tempo_deslocamento(session, filepath):
    print(f"Semeando Tensor Tempo Deslocamento a partir de {filepath}...")
    clear_table(session, TensorTempoDeslocamento)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ttd = TensorTempoDeslocamento(
                cluster_origem=to_str(row.get("cluster_origem")),
                cluster_destino=to_str(row.get("cluster_destino")),
                mesmo_cluster=to_int(row.get("mesmo_cluster")),
                n_observacoes=to_int(row.get("n_observacoes")),
                dist_media_km=to_float(row.get("dist_media_km")),
                dist_p25_km=to_float(row.get("dist_p25_km")),
                dist_p75_km=to_float(row.get("dist_p75_km")),
                periodo_predominante=to_str(row.get("periodo_predominante"))
            )
            batch.append(ttd)
            count += 1
            if len(batch) >= 1000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'tensor_tempo_deslocamento'.")

def seed_trajetos_comuns(session, filepath):
    print(f" Semeando Trajetos Comuns a partir de {filepath}...")
    clear_table(session, TrajetosComuns)
    
    count = 0
    batch = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tc = TrajetosComuns(
                cluster_origem=to_str(row.get("cluster_origem")),
                municipio_origem=to_str(row.get("municipio_origem")),
                lat_origem=to_float(row.get("lat_origem")),
                lon_origem=to_float(row.get("lon_origem")),
                cluster_destino=to_str(row.get("cluster_destino")),
                municipio_destino=to_str(row.get("municipio_destino")),
                lat_destino=to_float(row.get("lat_destino")),
                lon_destino=to_float(row.get("lon_destino")),
                mesmo_cluster=to_int(row.get("mesmo_cluster")),
                n_usuarios=to_int(row.get("n_usuarios")),
                n_viagens=to_int(row.get("n_viagens")),
                dist_media_km=to_float(row.get("dist_media_km")),
                periodo_predominante=to_str(row.get("periodo_predominante"))
            )
            batch.append(tc)
            count += 1
            if len(batch) >= 1000:
                session.bulk_save_objects(batch)
                session.commit()
                batch = []
        if batch:
            session.bulk_save_objects(batch)
            session.commit()
            
    print(f"{count} registros inseridos na tabela 'trajetos_comuns'.")


def main():
    parser = argparse.ArgumentParser(description="Seed do banco de dados a partir dos CSVs do appbit")
    parser.add_argument("--appbit-dir", type=str, default=None, help="Caminho personalizado para o diretório appbit")
    parser.add_argument("--table", type=str, default=None, choices=[
        "antenas", "assinantes", "trajetos_comuns", "tensor_concentracao", 
        "tensor_fluxo_vias", "tensor_od", "tensor_tempo_deslocamento"
    ], help="Semeia apenas uma tabela específica")
    
    args = parser.parse_args()
    
    # Auto detect appbit directory
    appbit_dir = args.appbit_dir
    if not appbit_dir:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        possible_paths = [
            os.path.join(script_dir, "..", "..", "appbit"),
            os.path.join(script_dir, "..", "appbit"),
            "/appbit",
            "/app/appbit"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                appbit_dir = path
                break
        if not appbit_dir:
            print("Erro: Diretório 'appbit' não encontrado.")
            print("Por favor, fornece o caminho usando --appbit-dir /caminho/para/appbit")
            sys.exit(1)
            
    print(f"Usando o diretório de dados: {appbit_dir}")
    
    files = {
        "antenas": os.path.join(appbit_dir, "dataset-visent", "referencias", "antenas_flp.csv"),
        "assinantes": os.path.join(appbit_dir, "dataset-visent", "referencias", "assinantes.csv"),
        "trajetos_comuns": os.path.join(appbit_dir, "dataset-visent", "referencias", "trajetos_comuns.csv"),
        "tensor_concentracao": os.path.join(appbit_dir, "dataset-visent", "tensores", "tensor_concentracao.csv"),
        "tensor_fluxo_vias": os.path.join(appbit_dir, "dataset-visent", "tensores", "tensor_fluxo_vias.csv"),
        "tensor_od": os.path.join(appbit_dir, "dataset-visent", "tensores", "tensor_od.csv"),
        "tensor_tempo_deslocamento": os.path.join(appbit_dir, "dataset-visent", "tensores", "tensor_tempo_deslocamento.csv"),
    }
    
    
    for name, path in files.items():
        if (args.table is None or args.table == name) and not os.path.exists(path):
            print(f"Arquivo não encontrado para '{name}': {path}")
            sys.exit(1)
            
    session = SessionLocal()
    
    try:
        if args.table:
            if args.table == "antenas":
                seed_antenas(session, files["antenas"])
            elif args.table == "assinantes":
                seed_assinantes(session, files["assinantes"])
            elif args.table == "trajetos_comuns":
                seed_trajetos_comuns(session, files["trajetos_comuns"])
            elif args.table == "tensor_concentracao":
                seed_tensor_concentracao(session, files["tensor_concentracao"])
            elif args.table == "tensor_fluxo_vias":
                seed_tensor_fluxo_vias(session, files["tensor_fluxo_vias"])
            elif args.table == "tensor_od":
                seed_tensor_od(session, files["tensor_od"])
            elif args.table == "tensor_tempo_deslocamento":
                seed_tensor_tempo_deslocamento(session, files["tensor_tempo_deslocamento"])
        else:
            seed_antenas(session, files["antenas"])
            seed_assinantes(session, files["assinantes"])
            seed_trajetos_comuns(session, files["trajetos_comuns"])
            seed_tensor_concentracao(session, files["tensor_concentracao"])
            seed_tensor_fluxo_vias(session, files["tensor_fluxo_vias"])
            seed_tensor_od(session, files["tensor_od"])
            seed_tensor_tempo_deslocamento(session, files["tensor_tempo_deslocamento"])
            
        print("\nSeed do banco de dados realizado com sucesso!")
        
    except Exception as e:
        print(f"\nErro durante o seeding: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    main()
