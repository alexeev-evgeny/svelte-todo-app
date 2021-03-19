<script lang="ts">
import { todos, addTodo, removeTodo } from '../store/Store';
import type { TTodo } from '../store/Store';
import TodoListItem from './TodoListItem.svelte';
import TodoListItemCreate from './TodoListItemCreate.svelte';

function onAddTodo(event: IEvent<TTodo>) {
	const { detail: newTodo } = event;
	addTodo(newTodo);
}

function onRemoveTodo(event: IEvent<number>) {
	const { detail: todoId } = event;
	removeTodo(todoId);
}

interface IEvent<T> extends CustomEvent {
	detail: T
}
</script>

<template>
<div class="row">
	<div class="column">
		<h2>Todos</h2>
		{#if $todos.length}
			{#each $todos as todo}
				<TodoListItem
					listItem="{todo}"
					on:remove="{onRemoveTodo}"
				></TodoListItem>
			{/each}
		{:else}
			<p class="message-empty">Empty</p>
		{/if}
	</div>
	<div class="column">
		<TodoListItemCreate
			on:addTodo="{onAddTodo}"
		></TodoListItemCreate>
	</div>
</div>


</template>

<style>
.row {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.column {
  flex: 50%;
  margin: 0 20px;
}

.message-empty {
	color: gray;
}
</style>

