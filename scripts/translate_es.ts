import { pt } from '../src/locales/pt';
import * as fs from 'fs';
import * as path from 'path';

// This is a naive translation script to generate ES from PT
// We'll replace key Portuguese words with Spanish equivalents for demonstration
// A real translation would use an API or a professional translator

function translateToSpanish(text: string): string {
    if (typeof text !== 'string') return text;

    // Very basic replacements - just to show the structure works
    let translated = text
        .replace(/Você/g, 'Usted')
        .replace(/você/g, 'usted')
        .replace(/Não/g, 'No')
        .replace(/não/g, 'no')
        .replace(/Sim/g, 'Sí')
        .replace(/Configurações/g, 'Configuraciones')
        .replace(/Usuários/g, 'Usuarios')
        .replace(/Módulos/g, 'Módulos')
        .replace(/Módulo/g, 'Módulo')
        .replace(/Cargos/g, 'Cargos')
        .replace(/Novo/g, 'Nuevo')
        .replace(/Nova/g, 'Nueva')
        .replace(/Editar/g, 'Editar')
        .replace(/Salvar/g, 'Guardar')
        .replace(/Excluir/g, 'Eliminar')
        .replace(/Gerenciar/g, 'Gestionar')
        .replace(/Acesso/g, 'Acceso')
        .replace(/Permissão/g, 'Permiso')
        .replace(/Permissões/g, 'Permisos')
        .replace(/Grupos/g, 'Grupos')
        .replace(/Grupo/g, 'Grupo')
        .replace(/Ativo/g, 'Activo')
        .replace(/Inativo/g, 'Inactivo')
        .replace(/Pesquisar/g, 'Buscar')
        .replace(/Nome/g, 'Nombre')
        .replace(/Descrição/g, 'Descripción')
        .replace(/Selecione/g, 'Seleccione')
        .replace(/Nenhum/g, 'Ninguno')
        .replace(/Nenhuma/g, 'Ninguna')
        .replace(/Encontrado/g, 'Encontrado')
        .replace(/Erro/g, 'Error')
        .replace(/Sucesso/g, 'Éxito')
        .replace(/Bem-vindo/g, 'Bienvenido')
        .replace(/Sair/g, 'Salir');

    return translated;
}

function deepTranslate(obj: any): any {
    if (typeof obj === 'string') {
        return translateToSpanish(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(deepTranslate);
    }

    if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
            result[key] = deepTranslate(obj[key]);
        }
        return result;
    }

    return obj;
}

const esObj = deepTranslate(pt);

const fileContent = `export const es = ${JSON.stringify(esObj, null, 4)};\n`;

fs.writeFileSync(path.join(__dirname, '../src/locales/es.ts'), fileContent, 'utf-8');
console.log('es.ts generated successfully!');
