import { writable } from 'svelte/store'

export const todos = writable([
	{
		id: 1616150160176,
		title: 'Number one',
		text: 'Adasdasdadadasdadadad'
	},
	{
		id: 1616150176804,
		title: 'Number two',
		text: 'Adasdasdadadasdadadad'
	},
	{
		id: 1616150190615,
		title: 'Number three',
		text: 'Adasdasdadadasdadadad'
	}
]);

export function addTodo(newTodo: TTodo) {
	todos.update((value) => {
		value.push(newTodo);
		return value
	});
}

export function removeTodo(todoId: number) {
	todos.update((value) => value.filter(({ id }) => id !== todoId))
}

export type TTodo = {
	id: number;
	title: string;
	text: string;
};
