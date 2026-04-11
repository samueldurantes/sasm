import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { StreamLanguage, StringStream } from "@codemirror/language";
import { Lexer } from "./tokenizer";
import { Parser } from "./parser";
import { Assembler } from "./assembler";

const MNEMONICS = new Set([
  "ldi",
  "mov",
  "add",
  "sub",
  "or",
  "xor",
  "and",
  "nop",
]);
const REGISTERS = new Set(["r1", "r2", "r3", "acc", "aux"]);

const sasm_lang = StreamLanguage.define<{}>({
  name: "sasm",
  startState: () => ({}),
  token(stream: StringStream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^;.*/)) return "comment";
    if (stream.match(/^\d+/)) return "number";
    if (stream.match(/^[,:]/)) return "punctuation";
    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      const w = (word as RegExpMatchArray)[0].toLowerCase();
      if (MNEMONICS.has(w)) return "keyword";
      if (REGISTERS.has(w)) return "variableName";
      if (stream.peek() === ":") return "labelName";
      return "name";
    }
    stream.next();
    return null;
  },
});

const FIELDS = [
  "extdataout",
  "r1in",
  "r1out",
  "r2in",
  "r2out",
  "r3in",
  "r3out",
  "accin",
  "accout",
  "auxin",
  "andout",
  "orout",
  "xorout",
  "addsub",
  "addout",
  "di3",
  "di2",
  "di1",
  "di0",
] as const;

const DEFAULT_SOURCE = `start:
    NOP
`;

const editor_parent = document.getElementById("editor") as HTMLDivElement;
const run_btn = document.getElementById("run") as HTMLButtonElement;
const copy_btn = document.getElementById("copy") as HTMLButtonElement;
const error_el = document.getElementById("error") as HTMLDivElement;
const table_wrap = document.getElementById("table-wrap") as HTMLDivElement;

let last_results: ReturnType<typeof assemble> = [];

const view = new EditorView({
  doc: DEFAULT_SOURCE,
  extensions: [basicSetup, keymap.of([indentWithTab]), sasm_lang],
  parent: editor_parent,
});

function assemble(source: string) {
  const tokens = new Lexer(source).tokenize();
  const program = new Parser(tokens).parse_program();
  return new Assembler(program.instructions).mount();
}

function render(results: ReturnType<typeof assemble>) {
  const thead = `
    <thead>
      <tr>
        <th>#</th>
        <th>instruction</th>
        ${FIELDS.map((f) => `<th>${f}</th>`).join("")}
        <th>opcode</th>
      </tr>
    </thead>`;

  const escape_html = (s: string) =>
    s.replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
    );

  const rows = results
    .map((r, i) => {
      const cells = FIELDS.map((f) => {
        const v = (r.microinstructions as Record<string, number>)[f] ?? 0;
        return `<td class="${v ? "on" : "off"}">${v}</td>`;
      }).join("");
      const instr_cell =
        i % 2 === 0
          ? `<td class="instr" rowspan="2">${escape_html(r.instruction)}</td>`
          : "";
      return `<tr><td>${i}</td>${instr_cell}${cells}<td>${r.opcode}</td></tr>`;
    })
    .join("");

  table_wrap.innerHTML = `<table>${thead}<tbody>${rows}</tbody></table>`;
}

function run() {
  error_el.textContent = "";
  try {
    last_results = assemble(view.state.doc.toString());
    render(last_results);
  } catch (e) {
    last_results = [];
    table_wrap.innerHTML = "";
    error_el.textContent = (e as Error).message;
  }
}

async function copy_opcodes() {
  if (!last_results.length) return;
  const text = last_results.map((r) => r.opcode).join(",");
  try {
    await navigator.clipboard.writeText(text);
    const original = copy_btn.textContent;
    copy_btn.textContent = "Copied!";
    setTimeout(() => (copy_btn.textContent = original), 1200);
  } catch {
    error_el.textContent = "Failed to copy to clipboard";
  }
}

run_btn.addEventListener("click", run);
copy_btn.addEventListener("click", copy_opcodes);
run();
