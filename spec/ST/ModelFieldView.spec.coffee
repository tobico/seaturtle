#require ST/Model
#require ST/ModelFieldView

$ ->
  Spec.describe 'ModelFieldView', ->
    beforeEach ->
      @modelField = ST.ModelFieldView.createWithModel(ST.Model)