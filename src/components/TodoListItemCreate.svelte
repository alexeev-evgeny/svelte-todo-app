<script lang="ts">
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

let newTodoTitle = '';
let newTodoText = '';
let isFormValid = true;

function addTodo() {
	if (!newTodoTitle || !newTodoText) {
		isFormValid = false;
		return;
	}
	
	isFormValid = true;
	dispatch('addTodo', {
		id: generateId(),
		title: newTodoTitle,
		text: newTodoText
	});
	reset();
}

function reset() {
	newTodoTitle = '';
	newTodoText = '';
}

function generateId() {
	return new Date().getTime();
}

</script>

<template>
<div class="form">
	<h2>New todo</h2>
	<div class="form__field">
		<input
			class="form__input"
			type="text" 
			placeholder="Заголовок"
			bind:value={newTodoTitle}
		/>
	</div>
	<div class="form__field">
		<textarea
			class="form__input"
			placeholder="Текст" 
			cols="30" 
			rows="10"
			bind:value={newTodoText}
		></textarea>
	</div>
	<div class="form__field">
		<button 
			class="form__button" 
			on:click="{addTodo}">
			Add
		</button>
	</div>

	{#if !isFormValid}
		<p class="form__error-message">Fill the form fields</p>
	{/if}
</div>
</template>

<style>
.form {
	display: block;
	width: 480px;
}

.form__field {
	margin-top: 10px;
	text-align: center;
}

.form__input {
	width: 100%;
}

.form__button {
	width: 100px;
	background-color: greenyellow;
	color: #000;
	cursor: pointer;
}

.form__error-message {
	display: block;
	padding: 20px;
	box-sizing: border-box;
	background-color: red;
	color: white;
}
</style>