// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('llama-ai-chat.chatWithLlama', () => {
		const panel = vscode.window.createWebviewPanel(
			'llamaChat',
			'Llama AI Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();
		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = '';

				try {
					const streamResponse = await ollama.chat({
						model: 'llama3.2:1b',
						messages: [{ role: 'user', content: userPrompt}],
						stream: true
					});

					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err) }`});
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<style>
				body { font-family: sans-serif: margin: 1 rem; }
				#prompt { width: 100%; box-sizing: border-box; }
				#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height:50px; }
			</style>
			<body>
				<h2>Llama AI Chat</h2>
				<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br />
				<button id="askBtn">Ask</button>
				<div id="response"></div>

				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('askBtn').addEventListener('click', () => {
						const text = document.getElementById('prompt').value;
						vscode.postMessage({ command: 'chat', text})
					});

					window.addEventListener('message', event => {
						const { command, text } = event.data;
						if (command === 'chatResponse') {
							document.getElementById('response').innerText = text;
						}
					});
				</script>
			</body>
			</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
